import { motion } from 'framer-motion';

export function BackgroundElements() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 1. Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* 2. Top Right Gradient Blob */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[10%] -right-[10%] w-[40rem] h-[40rem] rounded-full bg-indigo-200/40 blur-3xl mix-blend-multiply filter"
      />

      {/* 3. Bottom Left Gradient Blob */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute top-[20%] -left-[10%] w-[35rem] h-[35rem] rounded-full bg-purple-200/40 blur-3xl mix-blend-multiply filter"
      />

      {/* 4. Center/Bottom Gradient Blob */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-[10%] left-[30%] w-[45rem] h-[45rem] rounded-full bg-blue-100/50 blur-3xl mix-blend-multiply filter"
      />
    </div>
  );
}
