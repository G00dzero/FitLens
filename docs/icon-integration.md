# ICON garment reconstruction integration

The ICON checkout at `C:\Users\goody\OneDrive\Documents\ICON` is a GPU-backed Python CLI. It produces OBJ meshes from images; it does not provide an HTTP API and its license requires a valid MPG license agreement. FitLens therefore uses `server/icon_service.py` as a small local adapter:

1. The browser uploads a garment image to `POST /garment-reconstruction`, or a full-body image to `POST /body-reconstruction`.
3. The adapter runs ICON with an isolated temporary input/output directory.
4. The resulting OBJ is converted to GLB with `trimesh`.
5. The adapter serves only generated `.glb` and `.png` artifacts to the existing Three.js preview.

## Configuration

Run these commands from the FitLens repository in the Python environment that has the ICON dependencies installed:

```powershell
$env:ICON_ROOT = "C:\Users\goody\OneDrive\Documents\ICON"
$env:ICON_ARTIFACT_DIR = "C:\Users\goody\FitLens\var\icon-artifacts"
$env:ICON_PUBLIC_BASE_URL = "http://127.0.0.1:8010"
$env:ICON_ALLOWED_ORIGIN = "http://localhost:5173"
python server\icon_service.py
```

Set `VITE_GARMENT_3D_API_URL=http://127.0.0.1:8010/garment-reconstruction` in `.env.local`, then start FitLens with `npm run dev`.
Set `VITE_BODY_3D_API_URL=http://127.0.0.1:8010/body-reconstruction` as well to use the same adapter for the Try-On image flow.

The service exposes `GET /health` for readiness checks. Direct GLB uploads continue to use the browser-only path and do not require ICON.

## Body-model limitation

ICON reconstructs a clothed human from a single image. It does not produce a measurement-accurate unclothed body, so production sizing should validate its output against a dedicated body/SMPL service.

## Security review and operating controls

The repository security review found no actionable vulnerabilities in the reviewed code. The adapter adds the following controls:

- image uploads are limited to 25 MB and restricted to JPG, JPEG, PNG, and WebP;
- ICON is launched with an argument array and an explicit working directory, never through a shell;
- each request receives a private temporary workspace that is deleted after conversion;
- ICON execution has a 20-minute timeout and generated artifact paths are constrained to one configured directory;
- artifact downloads allow only generated `.glb` and `.png` basenames and set `X-Content-Type-Options: nosniff`;
- CORS is restricted to `ICON_ALLOWED_ORIGIN` plus the local Vite origins (`localhost:5173` and `127.0.0.1:5173`), and the default listener binds to loopback;
- do not expose this adapter directly to the public internet without authentication, rate limiting, a reverse proxy, and a cleanup/retention policy for generated artifacts.

ICON and its model weights remain third-party software. Review its license, model-weight terms, and dependency vulnerabilities before deploying it for production or commercial use.

The adapter returns a detailed runtime error when ICON dependencies or model weights are unavailable. ICON's documented environment is GPU-oriented; a machine without a supported NVIDIA/CUDA setup may pass the HTTP health check but still be unable to generate a mesh.
