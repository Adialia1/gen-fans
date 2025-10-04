"use client";
import { motion } from "framer-motion";
import React from "react";

interface GradientBlurInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export const GradientBlurIn: React.FC<GradientBlurInProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 1
}) => {
  const variants = {
    hidden: { filter: "blur(10px)", opacity: 0 },
    visible: { filter: "blur(0px)", opacity: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration, delay }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};