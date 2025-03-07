import React from 'react';
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
  // Scale factor for visual movement - reduced for more contained motion
  const positionMultiplier = 200; 
  const dragHint = track.oscillating ? "active" : "drag";
  
  // Calculate constrained position to stay within visible area
  const constrainedPosition = Math.max(Math.min(track.position * positionMultiplier, 350), -350);
  
  return (
    <div 
      className={cn(
        "absolute cursor-pointer transition-transform duration-150 ease-out",
        track.oscillating ? "animate-oscillate" : ""
      )}
      style={{
        left: `calc(50% + ${constrainedPosition}px)`, 
        top: `${(index + 0.5) * (100 / totalTracks)}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={(e) => onMouseDown(e, track.id)}
      data-oscillating={track.oscillating}
      data-direction={track.direction}
    >
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center relative",
        track.oscillating ? "animate-pulse-slow" : "",
        isTriggered ? "animate-ping" : "" // More noticeable trigger animation
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
