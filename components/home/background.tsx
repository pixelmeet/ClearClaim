"use client";

import { motion } from "framer-motion";

export function Background() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-60" />

      {/* Glowing orbs */}
      <motion.div
        className="absolute -left-[15%] -top-[20%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]"
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[10%] top-[10%] w-[400px] h-[400px] rounded-full bg-accent/15 blur-[100px]"
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
          scale: [1, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[30%] bottom-[10%] w-[350px] h-[350px] rounded-full bg-chart-3/10 blur-[100px]"
        animate={{
          x: [0, 20, -20, 0],
          y: [0, -30, 10, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[20%] bottom-[30%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay opacity-30" />
    </div>
  );
}