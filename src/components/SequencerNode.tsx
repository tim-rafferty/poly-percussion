
import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrackData } from '@/types/sequencer';

interface SequencerNodeProps {
  track: TrackData;
  index: number;
  totalTracks: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, trackId: number) => void;
  isTriggered: boolean;
}

const SequencerNode: React.FC<SequencerNodeProps> = ({
  track,
  index,
  totalTracks,
  onMouseDown,
  isTriggered
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const innerNodeRef = useRef<HTMLDivElement>(null);
  const outerNodeRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastPositionRef = useRef(track.position);
  
  // Use a more responsive multiplier for visual movement
  const positionMultiplier = 160;
  
  // Improved animation loop with optimized rendering
  useEffect(() => {
    if (!nodeRef.current) return;
    
    const updateNodePosition = () => {
      if (!nodeRef.current) return;
      
      // Calculate smooth interpolation for position changes
      const targetPosition = track.position;
      const currentPosition = lastPositionRef.current;
      
      // Adaptive smoothing based on distance to target position
      // Less smoothing when changes are small for responsiveness
      // More smoothing for larger changes to prevent jumps
      const distance = Math.abs(targetPosition - currentPosition);
      const interpolationFactor = Math.min(0.85, Math.max(0.5, 0.8 - distance * 0.5));
      
      // Apply smoothing with bias toward target position for faster response
      const newPosition = currentPosition * interpolationFactor + targetPosition * (1 - interpolationFactor);
      
      // Apply transform for better performance (avoids layout reflows)
      const xOffset = newPosition * positionMultiplier;
      nodeRef.current.style.transform = `translate(calc(-50% + ${xOffset}px), -50%)`;
      
      // Store for next frame
      lastPositionRef.current = newPosition;
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(updateNodePosition);
    };
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(updateNodePosition);
    
    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [track, positionMultiplier]);
  
  // Apply a smooth transition effect when triggered
  useEffect(() => {
    if (!innerNodeRef.current) return;
    
    if (isTriggered) {
      innerNodeRef.current.style.transform = 'scale(1.2)';
      innerNodeRef.current.style.opacity = '1';
      
      const timer = setTimeout(() => {
        if (innerNodeRef.current) {
          innerNodeRef.current.style.transform = '';
          innerNodeRef.current.style.opacity = '';
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isTriggered]);
  
  return (
    <div 
      ref={nodeRef}
      className="absolute cursor-pointer"
      style={{
        left: '50%',
        top: `${(index + 0.5) * (100 / totalTracks)}%`,
        // We'll handle all positioning via the transform property for better performance
        transform: `translate(calc(-50% + ${track.position * positionMultiplier}px), -50%)`,
        willChange: 'transform', // Hint to browser to optimize transforms
        touchAction: 'none' // Prevent unwanted touch actions during drag
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onMouseDown(e, track.id);
      }}
    >
      <div 
        ref={outerNodeRef}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          track.oscillating ? "animate-pulse-slow" : ""
        )}
      >
        <div 
          className="w-14 h-14 rounded-full transition-opacity duration-300"
          style={{ 
            backgroundColor: track.color,
            opacity: track.oscillating ? 0.7 : 0.4
          }}
        />
        <div 
          ref={innerNodeRef}
          className={cn(
            "absolute w-10 h-10 rounded-full sequencer-node-inner transition-all duration-150",
            track.oscillating ? "active" : ""
          )}
          style={{ 
            backgroundColor: track.color,
            transition: 'transform 150ms ease-out, opacity 150ms ease-out'
          }}
        />
      </div>
    </div>
  );
};

export default SequencerNode;
