import React from 'react';

export function AnimeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep dark gradient */}
      <div className="absolute inset-0 bg-[#08090d]" />

      {/* Cyber Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #8b5cf6 1px, transparent 1px),
            linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Ambient Neon Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sakura/15 rounded-full blur-[128px] animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet/15 rounded-full blur-[140px] animate-pulse-slow delay-1000" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan/15 rounded-full blur-[130px] animate-pulse-slow delay-700" />

      {/* Scanline subtle effect */}
      <div className="absolute inset-0 scanline-overlay opacity-30" />
    </div>
  );
}
