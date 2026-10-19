import { Box, Combine, Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ModelPreview } from "../components/ModelPreview";
import { mergeModels } from "../../lib/garment3d";

type StylePageProps = {
  bodyModelUrl: string | null;
  bodyPreviewUrl: string | null;
  garmentModelUrl: string | null;
  garmentPreviewUrl: string | null;
  mergedModelUrl: string | null;
  mergedPreviewUrl: string | null;
  onOpenGarment: () => void;
};

export function StylePage({ bodyModelUrl, bodyPreviewUrl, garmentModelUrl, garmentPreviewUrl, mergedModelUrl, mergedPreviewUrl, onOpenGarment }: StylePageProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [localMergedModelUrl, setLocalMergedModelUrl] = useState<string | null>(mergedModelUrl);
  const [localMergedPreviewUrl, setLocalMergedPreviewUrl] = useState<string | null>(mergedPreviewUrl);

  const handleMerge = async () => {
    if (!bodyModelUrl || !garmentModelUrl) return;
    setIsMerging(true);
    setMergeError("");
    try {
      const result = await mergeModels(bodyModelUrl, garmentModelUrl);
      setLocalMergedModelUrl(result.modelUrl);
      setLocalMergedPreviewUrl(result.previewUrl ?? null);
    } catch (error) {
      setMergeError(error instanceof Error ? error.message : "Unable to merge the body and garment models.");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pb-12 pt-24">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Style workspace</p>
              <h1 className="mb-2 text-4xl font-bold">Assemble your final fit</h1>
              <p className="max-w-2xl text-muted-foreground">Your generated body stays here while you add a 3D garment, reconstruct one from an image, and merge both models.</p>
            </div>
            <Sparkles className="mt-2 text-primary" size={28} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="body-model-heading">
              <div className="mb-4 flex items-center gap-3"><Box className="text-primary" size={20} /><div><h2 id="body-model-heading" className="font-semibold">Generated body</h2><p className="text-xs text-muted-foreground">From your body video</p></div></div>
              {bodyModelUrl ? <ModelPreview modelUrl={bodyModelUrl} label="Generated 3D body" /> : <div className="flex min-h-[260px] items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">Generate a body model from Try-On first.</div>}
              {bodyPreviewUrl && <p className="mt-3 text-xs text-muted-foreground">Body reconstruction preview available.</p>}
            </section>

            <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="garment-model-heading">
              <div className="mb-4 flex items-center gap-3"><Box className="text-primary" size={20} /><div><h2 id="garment-model-heading" className="font-semibold">Garment model</h2><p className="text-xs text-muted-foreground">Direct 3D upload or image reconstruction</p></div></div>
              {garmentModelUrl ? <ModelPreview modelUrl={garmentModelUrl} label="Generated 3D garment" /> : <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg bg-muted px-6 text-center"><Plus className="mb-3 text-muted-foreground" size={30} /><p className="text-sm text-muted-foreground">No garment model has been added yet.</p></div>}
              <button type="button" onClick={onOpenGarment} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 font-semibold text-primary hover:bg-primary/10"><Plus size={18} /> {garmentModelUrl ? "Replace garment" : "Add garment"}</button>
              {garmentPreviewUrl && <p className="mt-3 text-xs text-muted-foreground">Garment reconstruction preview available.</p>}
            </section>
          </div>

          <section className="mt-5 rounded-xl border border-border bg-card p-5" aria-labelledby="merge-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 id="merge-heading" className="font-semibold">Final combined model</h2><p className="text-sm text-muted-foreground">Merge the generated body and garment into one 3D result.</p></div>
              <button type="button" onClick={handleMerge} disabled={!bodyModelUrl || !garmentModelUrl || isMerging} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Combine size={18} /> {isMerging ? "Merging models..." : "Merge mock-ups"}</button>
            </div>
            {mergeError && <p role="alert" className="mt-4 text-sm text-destructive">{mergeError}</p>}
            {localMergedModelUrl ? <div className="mt-5 overflow-hidden rounded-lg"><ModelPreview modelUrl={localMergedModelUrl} label="Final combined 3D fit" />{localMergedPreviewUrl && <p className="mt-2 text-xs text-muted-foreground">Final combined preview available.</p>}</div> : <p className="mt-4 text-xs text-muted-foreground">Both model cards must be ready before merging.</p>}
          </section>
        </motion.div>
      </div>
    </div>
  );
}

export default StylePage;
