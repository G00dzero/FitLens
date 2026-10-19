const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type Body3DResult = {
  modelUrl: string;
  previewUrl?: string;
  jobId?: string;
};

export async function generateBody3D(video: File): Promise<Body3DResult> {
  if (!ACCEPTED_VIDEO_TYPES.has(video.type)) {
    throw new Error("The body scan must be an MP4, WebM, or MOV video.");
  }
  if (video.size > MAX_VIDEO_BYTES) {
    throw new Error("The body scan video must be smaller than 100 MB.");
  }

  const endpoint = import.meta.env.VITE_BODY_3D_API_URL as string | undefined;
  if (!endpoint) {
    throw new Error("3D body generation is not configured. Add VITE_BODY_3D_API_URL to the environment.");
  }

  const body = new FormData();
  body.append("video", video);
  const response = await fetch(endpoint, { method: "POST", body });
  if (!response.ok) throw new Error(`3D body generation failed (${response.status}).`);

  const payload = (await response.json()) as Partial<Body3DResult>;
  if (!payload.modelUrl) throw new Error("The 3D body service returned no model URL.");
  return payload as Body3DResult;
}