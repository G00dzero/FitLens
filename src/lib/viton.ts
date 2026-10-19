const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type VitonInput = {
  person: File;
  garment: File;
};

export type VitonResult = {
  resultUrl: string;
  jobId?: string;
};

function validateImage(file: File, label: string) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${label} must be a JPG, PNG, or WebP image.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${label} must be smaller than 12 MB.`);
  }
}

async function personInputToImage(file: File) {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
    validateImage(file, "The person photo");
    return file;
  }
  if (!ACCEPTED_VIDEO_TYPES.has(file.type)) {
    throw new Error("The person input must be a JPG, PNG, WebP, MP4, WebM, or MOV file.");
  }
  if (file.size > 80 * 1024 * 1024) {
    throw new Error("The person video must be smaller than 80 MB.");
  }

  const videoUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = videoUrl;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Unable to read the person video."));
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("Unable to extract a frame from the person video.");
    return new File([blob], "person-frame.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(videoUrl);
  }
}

export async function runViton(input: VitonInput): Promise<VitonResult> {
  validateImage(input.garment, "The garment photo");
  const personImage = await personInputToImage(input.person);

  const endpoint = import.meta.env.VITE_VITON_API_URL as string | undefined;
  if (!endpoint) {
    throw new Error("VITON inference is not configured. Add VITE_VITON_API_URL to the environment.");
  }

  const body = new FormData();
  body.append("person", personImage);
  body.append("garment", input.garment);

  const response = await fetch(endpoint, { method: "POST", body });
  if (!response.ok) {
    throw new Error(`VITON inference failed (${response.status}).`);
  }

  const payload = (await response.json()) as Partial<VitonResult>;
  if (!payload.resultUrl) {
    throw new Error("VITON returned no result image.");
  }

  return { resultUrl: payload.resultUrl, jobId: payload.jobId };
}

export function fileToPreviewUrl(file: File) {
  return URL.createObjectURL(file);
}