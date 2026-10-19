import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function FitlensLogo() {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Clothing to Text Animation */}
      <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
        {/* Shirt morphing to F-I-T */}
        <motion.path
          d={isAnimated
            ? "M20,20 L35,20 L35,50 L20,50 Z M40,20 L55,20 L55,50 L40,50 L40,35 L50,35 M60,20 L75,20 L75,25 L67,25 L67,50 L62,50 L62,25 L60,25 Z"
            : "M30,20 L50,15 L60,20 L70,20 L80,15 L100,20 L95,30 L95,60 L85,65 L75,60 L75,40 L55,40 L55,60 L45,65 L35,60 L35,30 Z"
          }
          fill="currentColor"
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Pants morphing to L-E-N-S */}
        <motion.path
          d={isAnimated
            ? "M20,70 L35,70 L35,100 L45,100 L45,105 L20,105 Z M50,70 L65,70 L65,75 L55,75 L55,85 L63,85 L63,90 L55,90 L55,100 L65,100 L65,105 L50,105 Z M70,70 L85,70 L85,105 L80,105 L80,85 L75,105 L70,105 Z M90,70 L105,70 L105,75 L100,80 L105,85 L105,90 L95,95 L90,90 L90,85 L100,85 L100,80 L95,75 L90,75 Z"
            : "M35,65 L55,65 L55,95 L50,110 L45,110 L40,95 Z M65,65 L85,65 L85,95 L80,110 L75,110 L70,95 Z"
          }
          fill="currentColor"
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
        />
      </svg>
    </div>
  );
}
