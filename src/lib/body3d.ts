const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type Body3DResult = {
  modelUrl: string;
  previewUrl?: string;
  jobId?: string;
};

export async function generateBody3D(image: File): Promise<Body3DResult> {
  if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
    throw new Error("The body image must be a JPG, PNG, or WebP image.");
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error("The body image must be smaller than 25 MB.");
  }

  const endpoint = import.meta.env.VITE_BODY_3D_API_URL as string | undefined;
  if (!endpoint) {
    throw new Error("3D body generation is not configured. Add VITE_BODY_3D_API_URL to the environment.");
  }

  const body = new FormData();
  body.append("image", image);
  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", body });
  } catch {
    throw new Error("Unable to reach the ICON body service. Confirm that the ICON adapter is running on http://127.0.0.1:8010.");
  }
  if (!response.ok) {
    let detail = "";
    try {
      const errorPayload = (await response.json()) as { error?: string };
      detail = errorPayload.error ? `: ${errorPayload.error}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`3D body generation failed (${response.status})${detail}`);
  }

  const payload = (await response.json()) as Partial<Body3DResult>;
  if (!payload.modelUrl) throw new Error("The 3D body service returned no model URL.");
  return payload as Body3DResult;
}