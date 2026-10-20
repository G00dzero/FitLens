import argparse
import cgi
import json
import mimetypes
import os
import shutil
import subprocess
import sys
import tempfile
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional, Set, Tuple
from urllib.parse import unquote, urlparse


MAX_UPLOAD_BYTES = 25 * 1024 * 1024
PROCESS_TIMEOUT_SECONDS = 20 * 60
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class IconServiceError(Exception):
    pass


def allowed_origins() -> Set[str]:
    configured = os.environ.get("ICON_ALLOWED_ORIGIN", "http://localhost:5173")
    return {origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()} | {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }


def cors_origin(request_origin: Optional[str]) -> str:
    if request_origin and request_origin.rstrip("/") in allowed_origins():
        return request_origin
    return "null"


def required_path(name: str) -> Path:
    value = os.environ.get(name)
    if not value:
        raise IconServiceError(f"{name} is not configured")
    path = Path(value).expanduser().resolve()
    if not path.is_dir():
        raise IconServiceError(f"{name} does not point to a directory")
    return path


def convert_obj_to_glb(obj_path: Path, glb_path: Path) -> None:
    try:
        import trimesh
    except ImportError as error:
        raise IconServiceError("trimesh is required in the ICON environment") from error

    mesh = trimesh.load(str(obj_path), file_type="obj", force="scene", process=False)
    if mesh.is_empty:
        raise IconServiceError("ICON returned an empty mesh")
    mesh.export(str(glb_path), file_type="glb")


def run_icon(image_path: Path, work_dir: Path) -> Tuple[Path, Optional[Path]]:
    icon_root = required_path("ICON_ROOT")
    python_executable = os.environ.get("ICON_PYTHON", sys.executable)
    config_path = os.environ.get("ICON_CONFIG", "configs/icon-filter.yaml")
    gpu = os.environ.get("ICON_GPU", "0")
    hps_type = os.environ.get("ICON_HPS_TYPE", "pixie")
    output_dir = work_dir / "results"
    input_dir = work_dir / "input"
    input_dir.mkdir()
    shutil.copyfile(image_path, input_dir / image_path.name)

    command = [
        python_executable,
        "-m",
        "apps.infer",
        "-cfg",
        config_path,
        "-gpu",
        gpu,
        "-in_dir",
        str(input_dir),
        "-out_dir",
        str(output_dir),
        "-hps_type",
        hps_type,
    ]
    try:
        completed = subprocess.run(
            command,
            cwd=icon_root,
            env={**os.environ, "PYTHONNOUSERSITE": "1"},
            capture_output=True,
            text=True,
            timeout=PROCESS_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise IconServiceError("ICON reconstruction timed out") from error
    except OSError as error:
        raise IconServiceError("Unable to start the ICON runtime") from error

    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip()[-1000:]
        raise IconServiceError(f"ICON reconstruction failed: {detail}")

    meshes = sorted(output_dir.rglob("*_recon.obj"))
    if not meshes:
        meshes = sorted(output_dir.rglob("*_refine.obj"))
    if not meshes:
        raise IconServiceError("ICON completed without returning a mesh")

    previews = sorted(output_dir.rglob("*_overlap.png"))
    return meshes[0], previews[0] if previews else None


def process_upload(upload, max_bytes: int, allowed_extensions: Set[str], field_name: str) -> Tuple[str, bytes]:
    if isinstance(upload, list) or not getattr(upload, "file", None):
        raise IconServiceError(f"The multipart request must contain one {field_name} file")
    filename = Path(upload.filename or field_name).name
    if Path(filename).suffix.lower() not in allowed_extensions:
        raise IconServiceError(f"Unsupported {field_name} file type")
    content = upload.file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise IconServiceError(f"The {field_name} file is too large")
    return filename, content


class IconHandler(BaseHTTPRequestHandler):
    server_version = "FitLens-ICON/1.0"

    def _send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", cors_origin(self.headers.get("Origin")))
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        if self.path.rstrip("/") not in {"/garment-reconstruction", "/body-reconstruction"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self._send_json(HTTPStatus.NO_CONTENT, {})

    def do_POST(self) -> None:
        route = self.path.rstrip("/")
        if route not in {"/garment-reconstruction", "/body-reconstruction"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid Content-Length"})
            return
        max_bytes = MAX_UPLOAD_BYTES
        if content_length <= 0 or content_length > max_bytes:
            self._send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": f"Upload must be smaller than {max_bytes // (1024 * 1024)} MB"})
            return

        content_type = self.headers.get("Content-Type", "")
        if not content_type.startswith("multipart/form-data"):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Expected multipart/form-data"})
            return

        try:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={"REQUEST_METHOD": "POST", "CONTENT_TYPE": content_type},
            )
            field_name = "image" if route == "/body-reconstruction" else "garment"
            allowed_extensions = ALLOWED_IMAGE_EXTENSIONS
            filename, content = process_upload(form[field_name], max_bytes, allowed_extensions, field_name)

            job_id = uuid.uuid4().hex
            with tempfile.TemporaryDirectory(prefix=f"fitlens-icon-{job_id}-") as temporary:
                work_dir = Path(temporary)
                upload_path = work_dir / filename
                upload_path.write_bytes(content)
                mesh_path, preview_path = run_icon(upload_path, work_dir)

                artifact_dir = required_path("ICON_ARTIFACT_DIR")
                artifact_dir.mkdir(parents=True, exist_ok=True)
                glb_path = artifact_dir / f"{job_id}.glb"
                convert_obj_to_glb(mesh_path, glb_path)
                preview_url = None
                if preview_path:
                    preview_target = artifact_dir / f"{job_id}.png"
                    shutil.copyfile(preview_path, preview_target)
                    preview_url = f"{os.environ.get('ICON_PUBLIC_BASE_URL', 'http://127.0.0.1:8010').rstrip('/')}/artifacts/{job_id}.png"

            base_url = os.environ.get("ICON_PUBLIC_BASE_URL", "http://127.0.0.1:8010").rstrip("/")
            self._send_json(
                HTTPStatus.OK,
                {"modelUrl": f"{base_url}/artifacts/{job_id}.glb", "previewUrl": preview_url, "jobId": job_id},
            )
        except (IconServiceError, KeyError, ValueError) as error:
            status = HTTPStatus.BAD_REQUEST
            if isinstance(error, IconServiceError) and (
                "ICON reconstruction failed" in str(error)
                or "trimesh is required" in str(error)
                or "ICON returned" in str(error)
            ):
                status = HTTPStatus.SERVICE_UNAVAILABLE
            self._send_json(status, {"error": str(error)})
        except (OSError, RuntimeError, TypeError) as error:
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": f"ICON reconstruction failed: {error}"})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._send_json(HTTPStatus.OK, {"status": "ok"})
            return
        if not parsed.path.startswith("/artifacts/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        artifact_relative_path = parsed.path[len("/artifacts/") :]
        artifact_name = Path(unquote(artifact_relative_path)).name
        if artifact_name != unquote(artifact_relative_path) or Path(artifact_name).suffix.lower() not in {".glb", ".png"}:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        artifact_path = required_path("ICON_ARTIFACT_DIR") / artifact_name
        if not artifact_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mimetypes.guess_type(artifact_name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(artifact_path.stat().st_size))
        self.send_header("Access-Control-Allow-Origin", cors_origin(self.headers.get("Origin")))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        with artifact_path.open("rb") as artifact:
            shutil.copyfileobj(artifact, self.wfile)

    def log_message(self, format: str, *args: object) -> None:
        sys.stderr.write(f"{self.address_string()} - {format % args}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="FitLens HTTP adapter for the ICON reconstruction backend")
    parser.add_argument("--host", default=os.environ.get("ICON_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("ICON_PORT", "8010")))
    args = parser.parse_args()
    required_path("ICON_ROOT")
    artifact_dir_value = os.environ.get("ICON_ARTIFACT_DIR")
    if not artifact_dir_value:
        raise IconServiceError("ICON_ARTIFACT_DIR is not configured")
    Path(artifact_dir_value).expanduser().resolve().mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), IconHandler)
    print(f"ICON service listening on http://{args.host}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
