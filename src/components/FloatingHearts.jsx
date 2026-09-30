import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function FloatingHearts({ count = 15 }) {
  // Generate random stable properties for the hearts
  const hearts = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 16) + 12, // 12px to 28px
      left: Math.random() * 96 + 2, // 2% to 98%
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 12, // 12s to 22s
      opacity: Math.random() * 0.35 + 0.15,
      rotate: Math.random() * 40 - 20,
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute text-rose-300 select-none"
          style={{
            left: `${heart.left}%`,
            bottom: '-40px',
            fontSize: `${heart.size}px`,
            opacity: heart.opacity,
          }}
          animate={{
            y: ['0vh', '-110vh'],
            x: [0, heart.rotate * 2, -heart.rotate * 2, 0],
            rotate: [heart.rotate, -heart.rotate, heart.rotate],
          }}
          transition={{
            duration: heart.duration,
            repeat: Infinity,
            delay: heart.delay,
            ease: 'linear',
          }}
        >
          <svg
            width={heart.size}
            height={heart.size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="drop-shadow-sm"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
