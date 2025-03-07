
import React from 'react';
import { cn } from '@/lib/utils';
import { TrackData } from '@/hooks/useSequencer';

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
  return (
    <div 
      className="absolute cursor-pointer transition-all duration-150 ease-out"
      style={{
        left: `calc(50% + ${track.position * 200}px)`, // Increased range for better visibility
        top: `${(index + 0.5) * (100 / totalTracks)}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={(e) => onMouseDown(e, track.id)}
      data-oscillating={track.oscillating}
    >
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center relative",
        track.oscillating ? "animate-pulse-slow" : "",
        isTriggered ? "animate-pulse-fast" : ""
      )}>
        <div 
          className="w-14 h-14 rounded-full opacity-40 transition-opacity duration-300 ease-out"
          style={{ 
            backgroundColor: track.color,
            opacity: track.oscillating ? 0.6 : 0.4
          }}
        />
        <div 
          className={cn(
            "absolute w-10 h-10 rounded-full sequencer-node-inner transition-all duration-300",
            track.oscillating ? "active" : "",
            isTriggered ? "scale-110" : ""
          )}
          style={{ backgroundColor: track.color }}
        />
        {!track.oscillating && (
          <div className="absolute text-white/70 text-xs font-mono pointer-events-none">
            drag
          </div>
        )}
        {track.oscillating && (
          <div className="absolute text-white/90 text-xs font-mono pointer-events-none animate-pulse">
            active
          </div>
        )}
      </div>
    </div>
  );
};

export default SequencerNode;
