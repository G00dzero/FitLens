import { motion } from "motion/react";
import { Image, LoaderCircle, Ruler, Sparkles, Upload } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useEffect, useRef, useState } from "react";
import { get, push, ref, set } from "firebase/database";
import { database } from "../../lib/firebase";
import { generateBody3D } from "../../lib/body3d";

type SizePreset = "S" | "M" | "L";
type SizingMode = "preset" | "measurements";

type Measurements = {
  height: string;
  waist: string;
  shoulder: string;
  bust: string;
  hip: string;
  weight: string;
};

const presetMeasurements: Record<SizePreset, Measurements> = {
  S: { height: "165", waist: "70", shoulder: "39", bust: "86", hip: "92", weight: "58" },
  M: { height: "172", waist: "80", shoulder: "43", bust: "96", hip: "100", weight: "70" },
  L: { height: "178", waist: "90", shoulder: "47", bust: "106", hip: "110", weight: "84" },
};

const measurementFields: Array<{ key: keyof Measurements; label: string; unit: string; min: number; max: number }> = [
  { key: "height", label: "Height", unit: "cm", min: 120, max: 230 },
  { key: "waist", label: "Waist", unit: "cm", min: 45, max: 180 },
  { key: "shoulder", label: "Shoulder", unit: "cm", min: 25, max: 75 },
  { key: "bust", label: "Bust", unit: "cm", min: 55, max: 180 },
  { key: "hip", label: "Hip", unit: "cm", min: 55, max: 190 },
  { key: "weight", label: "Weight", unit: "kg", min: 25, max: 250 },
];

const emptyMeasurements: Measurements = {
  height: "",
  waist: "",
  shoulder: "",
  bust: "",
  hip: "",
  weight: "",
};

function getFitEstimate(measurements: Measurements) {
  const values = Object.values(measurements).map(Number);
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    return { label: "Add measurements", detail: "Complete every field for a personalized estimate.", score: 0 };
  }

  const matches = (Object.keys(presetMeasurements) as SizePreset[]).map((size) => {
    const preset = presetMeasurements[size];
    const difference = measurementFields.reduce((total, field) => {
      const input = Number(measurements[field.key]);
      return total + Math.abs(input - Number(preset[field.key])) / (field.max - field.min);
    }, 0);
    return { size, difference };
  });
  const closest = matches.sort((a, b) => a.difference - b.difference)[0];
  const score = Math.max(62, Math.round(100 - closest.difference * 130));
  return {
    label: `Closest match: ${closest.size}`,
    detail: `Estimated ${score}% profile match. Use this as a guide, then compare the garment's size chart.`,
    score,
  };
}

function RotationWheel({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const angle = Math.atan2(event.clientX - centerX, centerY - event.clientY) * (180 / Math.PI);
    onChange(Math.round(angle));
  };

  return (
    <div className="flex items-center gap-3" aria-label="Rotate 3D preview">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Preview rotation"
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={value}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") onChange(Math.max(-180, value - 10));
          if (event.key === "ArrowRight") onChange(Math.min(180, value + 10));
        }}
        className="relative h-14 w-14 shrink-0 cursor-grab touch-none rounded-full border-4 border-primary/30 bg-muted shadow-inner outline-none focus:ring-2 focus:ring-ring active:cursor-grabbing"
      >
        <span
          className="absolute left-1/2 top-1/2 h-1/2 w-1 -translate-x-1/2 origin-bottom -translate-y-full rounded-full bg-primary"
          style={{ transform: `translateX(-50%) translateY(-100%) rotate(${value}deg)` }}
        />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">Rotate preview</p>
        <p className="text-xs text-muted-foreground">Drag the wheel or use arrow keys · {value}°</p>
      </div>
    </div>
  );
}

function ThreeFitPreview({ measurements, hasRendered, rotation, modelUrl }: { measurements: Measurements; hasRendered: boolean; rotation: number; modelUrl: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eef1f4");
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 1.65, 4.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 1.55, 0);
    controls.autoRotate = hasRendered;
    controls.autoRotateSpeed = 1.2;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa5b1, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.1, 64),
      new THREE.MeshStandardMaterial({ color: 0xdce2e8, roughness: 0.85 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.02;
    floor.receiveShadow = true;
    scene.add(floor);

    const body = new THREE.Group();
    const height = Number(measurements.height || 172) / 100;
    const waist = Number(measurements.waist || 80) / 100;
    const shoulder = Number(measurements.shoulder || 43) / 100;
    const bust = Number(measurements.bust || 96) / 100;
    const hip = Number(measurements.hip || 100) / 100;
    const scale = height / 1.72;
    const skin = new THREE.MeshStandardMaterial({ color: 0xb8795e, roughness: 0.72 });
    const garment = new THREE.MeshStandardMaterial({ color: 0x397c82, roughness: 0.42, metalness: 0.08 });

    const makePart = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      body.add(mesh);
      return mesh;
    };

    if (modelUrl) {
      new GLTFLoader().load(modelUrl, (gltf) => {
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        gltf.scene.rotation.y = THREE.MathUtils.degToRad(rotation);
        gltf.scene.scale.setScalar(scale);
        scene.add(gltf.scene);
      });
    } else {
      makePart(new THREE.SphereGeometry(0.13, 32, 20), skin, [0, 1.78, 0]);
      makePart(new THREE.CylinderGeometry(Math.max(0.19, bust / 2.7), Math.max(0.16, waist / 2.45), 0.62, 32), garment, [0, 1.34, 0]);
      makePart(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 20), skin, [0, 1.63, 0]);

      const shoulderWidth = Math.max(0.48, shoulder * 1.2);
      const armGeometry = new THREE.CapsuleGeometry(0.065, 0.5, 8, 16);
      makePart(armGeometry, skin, [-shoulderWidth / 2, 1.31, 0]);
      makePart(armGeometry, skin, [shoulderWidth / 2, 1.31, 0]);

      const legGeometry = new THREE.CapsuleGeometry(0.1, 0.62, 8, 16);
      makePart(legGeometry, skin, [-0.105, 0.66, 0]);
      makePart(legGeometry, skin, [0.105, 0.66, 0]);
      makePart(new THREE.SphereGeometry(0.12, 20, 12), skin, [-0.105, 0.13, 0.04]);
      makePart(new THREE.SphereGeometry(0.12, 20, 12), skin, [0.105, 0.13, 0.04]);

      const garmentSkirt = makePart(new THREE.CylinderGeometry(Math.max(0.22, hip / 3.2), Math.max(0.3, hip / 2.7), 0.46, 32), garment, [0, 0.92, 0]);
      garmentSkirt.scale.x = 1.05;
      body.scale.setScalar(scale);
      body.rotation.y = THREE.MathUtils.degToRad(rotation);
      scene.add(body);
    }

    const resize = () => {
      const width = mount.clientWidth || 320;
      const heightInPixels = mount.clientHeight || 420;
      camera.aspect = width / heightInPixels;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightInPixels, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, [measurements, hasRendered, rotation, modelUrl]);

  return <div ref={mountRef} className="h-full w-full" aria-label="Interactive 3D fit preview" role="img" />;
}

export function TryOnPage({ userId, renderedResultUrl, onOpenStyle }: { userId: string; renderedResultUrl?: string | null; onOpenStyle: (modelUrl: string, previewUrl?: string) => void }) {
  const [sizingMode, setSizingMode] = useState<SizingMode>("preset");
  const [selectedSize, setSelectedSize] = useState<SizePreset>("M");
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [hasRendered, setHasRendered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [persistenceError, setPersistenceError] = useState("");
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [bodyImageUrl, setBodyImageUrl] = useState<string | null>(null);
  const [bodyModelUrl, setBodyModelUrl] = useState<string | null>(null);
  const [bodyPreviewUrl, setBodyPreviewUrl] = useState<string | null>(null);
  const [bodyStatus, setBodyStatus] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [bodyError, setBodyError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    get(ref(database, `users/${userId}/profile`))
      .then((snapshot) => {
        if (!isCurrent || !snapshot.exists()) return;
        const profile = snapshot.val() as Partial<{
          sizingMode: SizingMode;
          selectedSize: SizePreset;
          measurements: Measurements;
        }>;
        if (profile.sizingMode === "preset" || profile.sizingMode === "measurements") {
          setSizingMode(profile.sizingMode);
        }
        if (profile.selectedSize === "S" || profile.selectedSize === "M" || profile.selectedSize === "L") {
          setSelectedSize(profile.selectedSize);
        }
        if (profile.measurements) {
          setMeasurements({ ...emptyMeasurements, ...profile.measurements });
        }
      })
      .catch(() => {
        if (isCurrent) setPersistenceError("Unable to load your saved fit profile.");
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  const activeMeasurements = sizingMode === "preset" ? presetMeasurements[selectedSize] : measurements;
  const fitEstimate = getFitEstimate(activeMeasurements);
  const isBodyReady = bodyStatus === "ready" && Boolean(bodyModelUrl);

  const handleBodyImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (bodyImageUrl) URL.revokeObjectURL(bodyImageUrl);
    setBodyImage(file);
    setBodyImageUrl(URL.createObjectURL(file));
    setBodyModelUrl(null);
    setBodyPreviewUrl(null);
    setBodyStatus("idle");
    setBodyError("");
  };

  const handleBodyGeneration = async () => {
    if (!bodyImage) return;
    setBodyStatus("generating");
    setBodyError("");
    try {
      const result = await generateBody3D(bodyImage);
      setBodyModelUrl(result.modelUrl);
      setBodyPreviewUrl(result.previewUrl ?? null);
      setBodyStatus("ready");
    } catch (error) {
      setBodyStatus("error");
      setBodyError(error instanceof Error ? error.message : "Unable to generate the 3D body.");
    }
  };

  const updateMeasurement = (key: keyof Measurements, value: string) => {
    setMeasurements((current) => ({ ...current, [key]: value }));
    setHasRendered(false);
  };

  const changePreset = (size: SizePreset) => {
    setSelectedSize(size);
    setHasRendered(false);
  };

  const handleSizeWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sizes: SizePreset[] = ["S", "M", "L"];
    const nextIndex = Math.min(2, Math.max(0, sizes.indexOf(selectedSize) + (event.deltaY > 0 ? 1 : -1)));
    changePreset(sizes[nextIndex]);
  };

  const handleRender = async () => {
    if (!bodyModelUrl || (sizingMode === "measurements" && !fitEstimate.score)) return;

    setIsSaving(true);
    setSaveProgress(12);
    setPersistenceError("");
    const createdAt = Date.now();
    const tryOnRef = push(ref(database, `users/${userId}/tryOns`));
    const progressTimer = window.setInterval(() => {
      setSaveProgress((current) => Math.min(90, current + 8));
    }, 160);

    try {
      await Promise.all([
        set(ref(database, `users/${userId}/profile`), {
          sizingMode,
          selectedSize,
          measurements,
          updatedAt: createdAt,
        }),
        set(tryOnRef, {
          createdAt,
          sizingMode,
          selectedSize,
          measurements: activeMeasurements,
          fitEstimate,
          rotation,
        }),
      ]);
      setSaveProgress(100);
      setHasRendered(true);
      onOpenStyle(bodyModelUrl, bodyPreviewUrl ?? undefined);
    } catch {
      setPersistenceError("Your fit was previewed, but could not be saved. Check your connection and try again.");
    } finally {
      window.clearInterval(progressTimer);
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-3 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-24">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 text-3xl font-bold sm:text-4xl">3D Virtual Try-On</h1>
          <p className="mb-7 max-w-2xl text-sm text-muted-foreground sm:mb-10 sm:text-base">Shape a private 3D fit profile, choose a size, and preview how the garment will sit on your proportions.</p>

          <section className="mb-5 rounded-xl border border-border bg-card p-4 sm:p-6" aria-labelledby="body-image-heading">
            <div className="mb-5 flex items-center gap-3">
              <Image className="text-primary" size={22} />
              <div>
                <h2 id="body-image-heading" className="text-xl font-semibold">Step 1: Generate your 3D body</h2>
                <p className="text-sm text-muted-foreground">Upload a clear full-body image for ICON to create your 3D representation.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <label className="block cursor-pointer rounded-lg border-2 border-dashed border-border p-4 hover:border-primary/60">
                <div className="flex items-center gap-3">
                  <Upload className="text-primary" size={20} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{bodyImage ? bodyImage.name : "Choose a full-body image"}</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 25 MB</p>
                  </div>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBodyImage} className="hidden" />
              </label>
              <button type="button" onClick={handleBodyGeneration} disabled={!bodyImage || bodyStatus === "generating"} className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                {bodyStatus === "generating" ? <span className="inline-flex items-center gap-2"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Generating 3D body...</span> : isBodyReady ? "Regenerate 3D body" : "Generate 3D body"}
              </button>
            </div>
            {bodyImageUrl && <img src={bodyImageUrl} className="mt-4 max-h-64 w-full rounded-lg bg-muted object-contain" alt="Uploaded full-body image preview" />}
            {bodyStatus === "generating" && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite"><LoaderCircle size={16} className="animate-spin text-primary" aria-hidden="true" /> ICON is generating your 3D model. This may take a few minutes; please keep this page open.</p>}
            {bodyStatus === "ready" && <p className="mt-3 text-sm text-emerald-600">3D body generated. Custom measurements are now available below.</p>}
            {bodyError && <p role="alert" className="mt-3 text-sm text-destructive">{bodyError}</p>}
          </section>

          <div className={`grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 ${!isBodyReady ? "pointer-events-none opacity-50" : ""}`}>
            <section className="min-w-0 space-y-5" aria-labelledby="fit-profile-heading">
              <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Ruler className="text-primary" size={22} />
                  <div>
                    <h2 id="fit-profile-heading" className="text-xl font-semibold">Your fit profile</h2>
                    <p className="text-sm text-muted-foreground">Choose a quick size or enter your own measurements.</p>
                  </div>
                </div>
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:mb-6 sm:gap-2" role="tablist" aria-label="Sizing method">
                  <button type="button" role="tab" aria-selected={sizingMode === "preset"} onClick={() => setSizingMode("preset")} className={`py-2 rounded-md text-sm font-medium transition-colors ${sizingMode === "preset" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>S / M / L</button>
                  <button type="button" role="tab" aria-selected={sizingMode === "measurements"} onClick={() => setSizingMode("measurements")} className={`py-2 rounded-md text-sm font-medium transition-colors ${sizingMode === "measurements" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Exact measurements</button>
                </div>

                {sizingMode === "preset" ? (
                  <div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3" onWheel={handleSizeWheel} aria-label="Scroll to change size">
                      {(["S", "M", "L"] as SizePreset[]).map((size) => (
                        <button key={size} type="button" onClick={() => changePreset(size)} aria-pressed={selectedSize === size} className={`h-20 rounded-lg border-2 text-lg font-semibold transition-all ${selectedSize === size ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                          {size}
                          <span className="block text-xs font-normal text-muted-foreground">{presetMeasurements[size].height} cm</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Scroll over the size selector to move between S, M, and L.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {measurementFields.map((field) => (
                      <label key={field.key} className="text-sm font-medium">
                        {field.label}
                        <div className="relative mt-1">
                          <input type="number" min={field.min} max={field.max} value={measurements[field.key]} onChange={(event) => updateMeasurement(field.key, event.target.value)} placeholder={`${field.min}-${field.max}`} className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-ring" />
                          <span className="absolute right-3 top-2 text-xs text-muted-foreground">{field.unit}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

            </section>

            <section className="min-w-0 lg:sticky lg:top-28" aria-labelledby="preview-heading">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div><h2 id="preview-heading" className="font-semibold">3D fit preview</h2><p className="text-xs text-muted-foreground">{sizingMode === "preset" ? `Size ${selectedSize} profile` : "Custom profile"}</p></div>
                  <Sparkles size={18} className="text-primary" />
                </div>
                  <div className="relative h-[min(420px,55vh)] min-h-[300px] overflow-hidden bg-gradient-to-b from-muted/50 to-background [perspective:900px] sm:min-h-[360px]">
                  {renderedResultUrl && <img src={renderedResultUrl} alt="Generated VITON try-on result" className="absolute inset-4 z-10 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain opacity-90" />}
                  <div className="absolute inset-x-8 top-8 h-px bg-border" />
                  {isBodyReady && <ThreeFitPreview measurements={activeMeasurements} hasRendered={hasRendered} rotation={rotation} modelUrl={bodyModelUrl ?? ""} />}
                  {!isBodyReady && <div className="flex h-full items-center justify-center px-8 text-center text-sm text-muted-foreground">Your generated 3D body will appear here.</div>}
                  {bodyPreviewUrl && <img src={bodyPreviewUrl} alt="Generated 3D body preview" className="pointer-events-none absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain opacity-25" />}
                  <span className="absolute bottom-5 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">Proportional preview</span>
                </div>
                <div className="p-5 space-y-4">
                  <RotationWheel value={rotation} onChange={setRotation} />
                  <div><div className="flex justify-between text-sm font-medium"><span>{fitEstimate.label}</span><span>{fitEstimate.score ? `${fitEstimate.score}%` : "-"}</span></div><div className="mt-2 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fitEstimate.score}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{fitEstimate.detail}</p></div>
                  {persistenceError && <p role="alert" className="text-sm text-destructive">{persistenceError}</p>}
                  {isSaving ? (
                    <div role="progressbar" aria-label="Saving fit measurements" aria-valuemin={0} aria-valuemax={100} aria-valuenow={saveProgress} className="w-full overflow-hidden rounded-lg border border-primary/30 bg-primary/10 p-1">
                      <div className="relative h-10 overflow-hidden rounded-md bg-primary/15">
                        <div className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-150" style={{ width: `${saveProgress}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary-foreground">Saving fit profile... {saveProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={handleRender} disabled={!isBodyReady || (sizingMode === "measurements" && !fitEstimate.score)} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">Save fit and choose garment</button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
