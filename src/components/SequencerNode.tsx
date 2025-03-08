
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
  const currentPositionRef = useRef(track.position);
  
  // Position multiplier for visual movement
  const positionMultiplier = 160;
  
  // Smooth position updates with optimized rendering
  useEffect(() => {
    if (!nodeRef.current) return;
    
    // Update node position immediately for direct interaction
    // This avoids the lag that can cause glitchy dragging
    nodeRef.current.style.transform = `translate(calc(-50% + ${track.position * positionMultiplier}px), -50%)`;
    currentPositionRef.current = track.position;
    
  }, [track.position, positionMultiplier]);
  
  // Handle trigger visual effect
  useEffect(() => {
    if (!innerNodeRef.current || !isTriggered) return;
    
    // Apply visual feedback when triggered
    innerNodeRef.current.style.transform = 'scale(1.2)';
    innerNodeRef.current.style.opacity = '1';
    
    // Reset visual state after animation
    const timer = setTimeout(() => {
      if (innerNodeRef.current) {
        innerNodeRef.current.style.transform = '';
        innerNodeRef.current.style.opacity = '';
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [isTriggered]);
  
  return (
    <div 
      ref={nodeRef}
      className="absolute cursor-pointer"
      style={{
        left: '50%',
        top: `${(index + 0.5) * (100 / totalTracks)}%`,
        transform: `translate(calc(-50% + ${track.position * positionMultiplier}px), -50%)`,
        willChange: 'transform',
        touchAction: 'none'
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onMouseDown(e, track.id);
      }}
    >
      <div 
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
            transition: 'transform 150ms ease-out, opacity 150ms ease-out',
            willChange: 'transform, opacity'
          }}
        />
      </div>
    </div>
  );
};

export default SequencerNode;
