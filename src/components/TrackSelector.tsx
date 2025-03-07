
import React from 'react';
import { cn } from '@/lib/utils';
import { TrackData } from '@/hooks/useSequencer';

interface TrackSelectorProps {
  tracks: TrackData[];
  selectedTrackId: number | null;
  onSelectTrack: (trackId: number) => void;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack
}) => {
  return (
    <div className="flex justify-center space-x-4 mb-6 mt-8">
      {tracks.map(track => (
        <div 
          key={track.id}
          className={cn(
            "w-14 h-14 rounded-full cursor-pointer flex items-center justify-center relative track-selector-item",
            selectedTrackId === track.id ? "selected" : ""
          )}
          onClick={() => onSelectTrack(track.id)}
        >
          <div 
            className="w-14 h-14 rounded-full opacity-40"
            style={{ backgroundColor: track.color }}
          />
          <div 
            className="absolute w-10 h-10 rounded-full"
            style={{ backgroundColor: track.color }}
          />
          {track.muted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-0.5 bg-white/80 transform rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrackSelector;
