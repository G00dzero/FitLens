export type Garment3DResult = {
  modelUrl: string;
  previewUrl?: string;
  jobId?: string;
};

const ACCEPTED_TYPES = new Set([
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function generateGarment3D(file: File): Promise<Garment3DResult> {
  if (!ACCEPTED_TYPES.has(file.type) && !/\.(glb|gltf|jpg|jpeg|png|webp)$/i.test(file.name)) {
    throw new Error("Upload a GLB, glTF, JPG, PNG, or WebP garment file.");
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("The garment file must be smaller than 50 MB.");
  }

  if (/\.(glb|gltf)$/i.test(file.name) || file.type === "model/gltf-binary" || file.type === "model/gltf+json") {
    return { modelUrl: URL.createObjectURL(file) };
  }

  const endpoint = import.meta.env.VITE_GARMENT_3D_API_URL as string | undefined;
  if (!endpoint) {
    throw new Error("Garment 3D reconstruction is not configured. Add VITE_GARMENT_3D_API_URL to the environment.");
  }
  const body = new FormData();
  body.append("garment", file);
  const response = await fetch(endpoint, { method: "POST", body });
  if (!response.ok) throw new Error(`Garment reconstruction failed (${response.status}).`);
  const payload = (await response.json()) as Partial<Garment3DResult>;
  if (!payload.modelUrl) throw new Error("The garment service returned no model URL.");
  return payload as Garment3DResult;
}

export async function mergeModels(bodyModelUrl: string, garmentModelUrl: string) {
  const endpoint = import.meta.env.VITE_MERGE_3D_API_URL as string | undefined;
  if (!endpoint) {
    throw new Error("3D model merging is not configured. Add VITE_MERGE_3D_API_URL to the environment.");
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bodyModelUrl, garmentModelUrl }),
  });
  if (!response.ok) throw new Error(`3D model merging failed (${response.status}).`);
  const payload = (await response.json()) as Partial<Garment3DResult>;
  if (!payload.modelUrl) throw new Error("The merge service returned no model URL.");
  return payload as Garment3DResult;
}