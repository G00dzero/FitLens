import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ClothingItem {
  emoji: string;
  x: string;
  y: string;
  duration: number;
  delay: number;
}

export function FloatingClothes() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const clothingItems: ClothingItem[] = [
    { emoji: "👕", x: "10%", y: "15%", duration: 20, delay: 0 },
    { emoji: "👖", x: "80%", y: "25%", duration: 25, delay: 2 },
    { emoji: "👔", x: "15%", y: "60%", duration: 22, delay: 4 },
    { emoji: "🧥", x: "85%", y: "70%", duration: 28, delay: 1 },
    { emoji: "👗", x: "25%", y: "40%", duration: 24, delay: 3 },
    { emoji: "🩳", x: "70%", y: "50%", duration: 26, delay: 5 },
    { emoji: "🧢", x: "50%", y: "20%", duration: 23, delay: 2.5 },
    { emoji: "👟", x: "60%", y: "80%", duration: 21, delay: 4.5 },
    { emoji: "🧤", x: "30%", y: "85%", duration: 27, delay: 1.5 },
    { emoji: "🎽", x: "90%", y: "45%", duration: 25, delay: 3.5 },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      {clothingItems.map((item, index) => (
        <ClothingItemComponent
          key={index}
          item={item}
          mousePosition={mousePosition}
        />
      ))}
    </div>
  );
}

function ClothingItemComponent({ item, mousePosition }: { item: ClothingItem; mousePosition: { x: number; y: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const springConfig = { damping: 20, stiffness: 100 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  useEffect(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const itemCenterX = rect.left + rect.width / 2;
    const itemCenterY = rect.top + rect.height / 2;

    const distanceX = mousePosition.x - itemCenterX;
    const distanceY = mousePosition.y - itemCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    const maxDistance = 200;
    const pushStrength = 60;

    if (distance < maxDistance) {
      const force = (1 - distance / maxDistance) * pushStrength;
      const angle = Math.atan2(distanceY, distanceX);

      x.set(-Math.cos(angle) * force);
      y.set(-Math.sin(angle) * force);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mousePosition, x, y]);

  return (
    <motion.div
      ref={ref}
      className="absolute text-6xl"
      style={{
        left: item.x,
        top: item.y,
        x,
        y,
      }}
      animate={{
        y: [0, -30, 0],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: item.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: item.delay,
      }}
    >
      {item.emoji}
    </motion.div>
  );
}
