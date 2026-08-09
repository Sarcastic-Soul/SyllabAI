"use client";

import React from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  maxDistance?: number;
}

export default function MagneticButton({
  children,
  className = "",
}: MagneticButtonProps) {
  return <div className={className}>{children}</div>;
}
