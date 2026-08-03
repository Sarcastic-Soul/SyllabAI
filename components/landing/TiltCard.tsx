"use client";

import React from "react";
import Tilt from "react-parallax-tilt";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngleX?: number;
  tiltMaxAngleY?: number;
  scale?: number;
  glareEnable?: boolean;
}

export default function TiltCard({
  children,
  className = "",
  tiltMaxAngleX = 7,
  tiltMaxAngleY = 7,
  scale = 1.02,
  glareEnable = true,
}: TiltCardProps) {
  return (
    <Tilt
      tiltMaxAngleX={tiltMaxAngleX}
      tiltMaxAngleY={tiltMaxAngleY}
      perspective={1000}
      scale={scale}
      transitionSpeed={1200}
      glareEnable={glareEnable}
      glareMaxOpacity={0.08}
      glareColor="#fe5933"
      glarePosition="all"
      glareBorderRadius="1.5rem"
      className={className}
    >
      {children}
    </Tilt>
  );
}
