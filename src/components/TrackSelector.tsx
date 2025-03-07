
import React from 'react';
import { cn } from '@/lib/utils';
import { TrackData } from '@/hooks/useSequencer';

interface TrackSelectorProps {
  tracks: TrackData[];
  selectedTrackId: number | null;
  onSelectTrack: (trackId: number | null) => void;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack
}) => {
  const handleTrackClick = (trackId: number) => {
    // Toggle selection - if already selected, deselect it
    if (selectedTrackId === trackId) {
      onSelectTrack(null);
    } else {
      onSelectTrack(trackId);
    }
  };

  return (
    <div className="flex justify-center space-x-3 mb-4 mt-4">
      {tracks.map(track => (
        <div 
          key={track.id}
          className={cn(
            "w-12 h-12 rounded-full cursor-pointer flex items-center justify-center relative track-selector-item",
            selectedTrackId === track.id ? "selected" : ""
          )}
          onClick={() => handleTrackClick(track.id)}
        >
          <div 
            className="w-12 h-12 rounded-full opacity-40"
            style={{ backgroundColor: track.color }}
          />
          <div 
            className="absolute w-8 h-8 rounded-full"
            style={{ backgroundColor: track.color }}
          />
          {track.muted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-white/80 transform rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrackSelector;
