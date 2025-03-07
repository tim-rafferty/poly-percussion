
import { useState } from 'react';
import { TrackData } from '@/types/sequencer';

interface UseSequencerDragProps {
  tracks: TrackData[];
  setTracks: React.Dispatch<React.SetStateAction<TrackData[]>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useSequencerDrag = ({
  tracks,
  setTracks,
  isPlaying,
  setIsPlaying
}: UseSequencerDragProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTrackId, setDragTrackId] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [previousDeltaX, setPreviousDeltaX] = useState(0);
  
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    setPreviousDeltaX(0);
    
    // Pause oscillation during drag but remember position
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, oscillating: false } 
          : track
      )
    );
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDragging || dragTrackId === null) return;
    
    const deltaX = e.clientX - dragStartX;
    
    // Apply smoothing by blending previous and current delta
    const smoothedDeltaX = previousDeltaX * 0.5 + deltaX * 0.5;
    setPreviousDeltaX(smoothedDeltaX);
    
    // More controlled amplitude calculation with better constraints
    const amplitude = Math.min(Math.max(Math.abs(smoothedDeltaX) / 100, 0.1), 1.0);
    
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === dragTrackId 
          ? { 
              ...track, 
              amplitude,
              // Smoother initial position with constrained movement
              position: smoothedDeltaX > 0 ? amplitude * 0.5 : -amplitude * 0.5 
            } 
          : track
      )
    );
  };
  
  const handleMouseUp = () => {
    if (!isDragging || dragTrackId === null) return;
    
    const currentTrack = tracks.find(track => track.id === dragTrackId);
    
    setIsDragging(false);
    
    // Lower threshold to start oscillating for better responsiveness
    if (currentTrack && Math.abs(currentTrack.position) > 0.02) {
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { 
                ...track, 
                oscillating: true,
                // Ensure initial direction is set for immediate triggering
                direction: track.position > 0 ? 'right-to-left' : 'left-to-right'
              }
            : track
        )
      );
      
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
    
    setDragTrackId(null);
    setPreviousDeltaX(0);
  };
  
  return {
    isDragging,
    dragTrackId,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
