import { motion } from "motion/react";
import { Ruler, Sparkles } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useEffect, useRef, useState } from "react";
import { get, push, ref, set } from "firebase/database";
import { database } from "../../lib/firebase";

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

function ThreeFitPreview({ measurements, hasRendered, rotation }: { measurements: Measurements; hasRendered: boolean; rotation: number }) {
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
  }, [measurements, hasRendered, rotation]);

  return <div ref={mountRef} className="h-full w-full" aria-label="Interactive 3D fit preview" role="img" />;
}

export function TryOnPage({ userId }: { userId: string }) {
  const [sizingMode, setSizingMode] = useState<SizingMode>("preset");
  const [selectedSize, setSelectedSize] = useState<SizePreset>("M");
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [hasRendered, setHasRendered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [persistenceError, setPersistenceError] = useState("");

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
    if (sizingMode === "measurements" && !fitEstimate.score) return;

    setIsSaving(true);
    setPersistenceError("");
    const createdAt = Date.now();
    const tryOnRef = push(ref(database, `users/${userId}/tryOns`));

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
      setHasRendered(true);
    } catch {
      setPersistenceError("Your fit was previewed, but could not be saved. Check your connection and try again.");
    } finally {
      setIsSaving(false);
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

          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8">
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
                  <div className="absolute inset-x-8 top-8 h-px bg-border" />
                  <ThreeFitPreview measurements={activeMeasurements} hasRendered={hasRendered} rotation={rotation} />
                  <span className="absolute bottom-5 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">Proportional preview</span>
                </div>
                <div className="p-5 space-y-4">
                  <RotationWheel value={rotation} onChange={setRotation} />
                  <div><div className="flex justify-between text-sm font-medium"><span>{fitEstimate.label}</span><span>{fitEstimate.score ? `${fitEstimate.score}%` : "-"}</span></div><div className="mt-2 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fitEstimate.score}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{fitEstimate.detail}</p></div>
                  {persistenceError && <p role="alert" className="text-sm text-destructive">{persistenceError}</p>}
                  <button type="button" onClick={handleRender} disabled={isSaving || (sizingMode === "measurements" && !fitEstimate.score)} className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving fit..." : "Render this fit"}</button>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
