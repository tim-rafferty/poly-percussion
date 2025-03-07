
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
  // Use a ref to store the DOM element for direct manipulation
  const nodeRef = useRef<HTMLDivElement>(null);
  const lastRafRef = useRef<number | null>(null);
  const lastPositionRef = useRef(track.position);
  
  // Scale factor for visual movement - adjusted for better visibility
  const positionMultiplier = 180; 
  const dragHint = track.oscillating ? "active" : "drag";
  
  // Update the node position using requestAnimationFrame for smoother transitions
  useEffect(() => {
    if (!nodeRef.current) return;
    
    const updatePosition = () => {
      if (!nodeRef.current) return;
      
      // Apply interpolation for smoother motion between frames
      const currentPosition = track.position;
      const lastPosition = lastPositionRef.current;
      
      // Adaptive interpolation - slower for large changes, faster for small changes
      // This prevents both jumpiness and lag
      const delta = Math.abs(currentPosition - lastPosition);
      const interpolationFactor = Math.min(0.8, Math.max(0.3, 0.7 - delta));
      
      const interpolatedPosition = lastPosition * interpolationFactor + currentPosition * (1 - interpolationFactor);
      
      // Calculate constrained position to stay within visible area
      const constrainedPosition = Math.max(Math.min(interpolatedPosition * positionMultiplier, 300), -300);
      
      // Apply the position
      nodeRef.current.style.left = `calc(50% + ${constrainedPosition}px)`;
      
      // Store the interpolated position for next frame
      lastPositionRef.current = interpolatedPosition;
      
      // Continue the animation loop
      lastRafRef.current = requestAnimationFrame(updatePosition);
    };
    
    // Start the animation frame
    lastRafRef.current = requestAnimationFrame(updatePosition);
    
    // Cleanup when component unmounts or track changes
    return () => {
      if (lastRafRef.current) {
        cancelAnimationFrame(lastRafRef.current);
        lastRafRef.current = null;
      }
    };
  }, [track, positionMultiplier]);
  
  return (
    <div 
      ref={nodeRef}
      className={cn(
        "absolute cursor-pointer",
        track.oscillating ? "animate-oscillate" : ""
      )}
      style={{
        // Only set initial position in style - dynamic updates via ref
        left: `calc(50% + ${track.position * positionMultiplier}px)`, 
        top: `${(index + 0.5) * (100 / totalTracks)}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'none' // Remove transitions - we're handling all animation with RAF
      }}
      onMouseDown={(e) => {
        // Prevent text selection and default behavior during drag
        e.preventDefault();
        e.stopPropagation();
        onMouseDown(e, track.id);
      }}
      data-oscillating={track.oscillating}
      data-direction={track.direction}
    >
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center relative",
        track.oscillating ? "animate-pulse-slow" : "",
        isTriggered ? "scale-110 transition-transform duration-150" : "" // More controlled trigger animation
      )}>
        <div 
          className="w-14 h-14 rounded-full transition-opacity duration-300 ease-out"
          style={{ 
            backgroundColor: track.color,
            opacity: track.oscillating ? 0.7 : 0.4
          }}
        />
        <div 
          className={cn(
            "absolute w-10 h-10 rounded-full sequencer-node-inner transition-all duration-300",
            track.oscillating ? "active" : "",
            isTriggered ? "scale-125" : "" // More dramatic scale effect
          )}
          style={{ backgroundColor: track.color }}
        />
        <div className={cn(
          "absolute text-white/90 text-xs font-mono pointer-events-none",
          track.oscillating ? "animate-pulse" : ""
        )}>
          {dragHint}
        </div>
      </div>
    </div>
  );
};

export default SequencerNode;
