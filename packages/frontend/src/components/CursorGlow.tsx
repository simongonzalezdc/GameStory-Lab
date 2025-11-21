import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export function CursorGlow() {
  const [isVisible, setIsVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Main cursor glow */}
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle 200px at ${springX}px ${springY}px, color-mix(in srgb, var(--jewel-topaz) 3%, transparent), color-mix(in srgb, var(--jewel-garnet) 2%, transparent), transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Floating ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute"
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, var(--jewel-amethyst) 4%, transparent), transparent 70%)`,
            top: '20%',
            left: '10%',
          }}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute"
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, var(--jewel-garnet) 3%, transparent), transparent 70%)`,
            bottom: '15%',
            right: '15%',
          }}
          animate={{
            y: [0, 15, 0],
            scale: [1, 0.9, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute"
          style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, var(--jewel-topaz) 2%, transparent), transparent 70%)`,
            top: '60%',
            right: '30%',
          }}
          animate={{
            y: [0, -10, 0],
            scale: [1, 1.05, 1],
            opacity: [0.25, 0.35, 0.25],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </div>
    </>
  );
}
