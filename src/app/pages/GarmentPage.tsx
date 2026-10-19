import { ArrowLeft, Box, ImagePlus, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { generateGarment3D } from "../../lib/garment3d";

export function GarmentPage({ onBack, onComplete }: { onBack: () => void; onComplete: (modelUrl: string, previewUrl?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!file) return;
    setIsGenerating(true);
    setError("");
    try {
      const result = await generateGarment3D(file);
      onComplete(result.modelUrl, result.previewUrl);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Unable to prepare the garment model.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pb-12 pt-24">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to Style</button>
          <h1 className="mb-2 text-4xl font-bold">Add garment model</h1>
          <p className="mb-8 text-muted-foreground">Upload a GLB or glTF garment model. If you only have an image, the garment reconstruction service will create a 3D model before returning you to Style.</p>
          <div className="rounded-xl border border-border bg-card p-6">
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/60">
              {file ? <Box size={36} className="mb-3 text-primary" /> : <Upload size={36} className="mb-3 text-muted-foreground" />}
              <span className="font-medium">{file ? file.name : "Choose a 3D model or garment image"}</span>
              <span className="mt-2 text-xs text-muted-foreground">GLB, glTF, JPG, PNG, or WebP up to 50 MB</span>
              <input type="file" accept=".glb,.gltf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="hidden" />
            </label>
            {file && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><ImagePlus size={16} /> Images are sent to the garment reconstruction service.</p>}
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
            <button type="button" onClick={handleGenerate} disabled={!file || isGenerating} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{isGenerating ? "Preparing garment model..." : "Prepare garment and return to Style"}</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}