import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';

interface FFTBackgroundProps {
  className?: string;
}

const FFTBackground: React.FC<FFTBackgroundProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Create analyzer node with higher FFT size for better resolution
    analyserRef.current = new Tone.Analyser('fft', 512);
    analyserRef.current.smoothing = 0.8; // Smoother transitions
    
    // Connect analyzer to master output
    Tone.Destination.connect(analyserRef.current);

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get FFT data
      const values = analyserRef.current.getValue();
      
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate center and radius
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const minDimension = Math.min(canvas.width, canvas.height);
      const maxRadius = minDimension * 0.45; // 90% of the smallest dimension
      const minRadius = maxRadius * 0.2; // Inner radius
      
      // Set up gradient for the visualization
      const gradient = ctx.createRadialGradient(
        centerX, centerY, minRadius,
        centerX, centerY, maxRadius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      
      // Draw circular FFT
      const angleStep = (2 * Math.PI) / values.length;
      
      // Draw outer circle
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const value = values[i] as number;
        const amplitude = Math.max(0, (value + 140) * 2);
        const radius = minRadius + (amplitude * (maxRadius - minRadius) / 100);
        const angle = i * angleStep - Math.PI / 2; // Start at top
        
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      // Add glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      
      // Stroke the path
      ctx.stroke();
      
      // Fill with a subtle gradient
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      
      // Draw inner circle with glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, minRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Animate
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (analyserRef.current) {
        analyserRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        if (parent) {
          // Use device pixel ratio for sharper rendering
          const dpr = window.devicePixelRatio || 1;
          canvas.width = parent.clientWidth * dpr;
          canvas.height = parent.clientHeight * dpr;
          canvas.style.width = `${parent.clientWidth}px`;
          canvas.style.height = `${parent.clientHeight}px`;
          
          // Scale the context to account for the device pixel ratio
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default FFTBackground; 