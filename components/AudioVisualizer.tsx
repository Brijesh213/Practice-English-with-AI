import React, { useEffect, useRef } from 'react';

interface Props {
  audioLevel: number; // 0 to 1
  isActive: boolean;
  color?: string;
}

const AudioVisualizer: React.FC<Props> = ({ audioLevel, isActive, color = '#f43f5e' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let currentLevel = 0;

    const render = () => {
      // Smooth interpolation
      currentLevel += (audioLevel - currentLevel) * 0.1;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 2;
      const baseRadius = maxRadius * 0.3;

      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        ctx.beginPath();
        // Draw 3 concentric circles that pulse
        for (let i = 0; i < 3; i++) {
            const opacity = 1 - (i * 0.3);
            const r = baseRadius + (currentLevel * maxRadius * (1 - i*0.2));
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(0, r), 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity * 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Center solid circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // Resting state
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#374151'; // Gray
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [audioLevel, isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      className="w-64 h-64 md:w-80 md:h-80 mx-auto"
    />
  );
};

export default AudioVisualizer;