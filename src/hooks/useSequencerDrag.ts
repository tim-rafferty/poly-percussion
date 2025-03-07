
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
  const [dragVelocity, setDragVelocity] = useState(0);
  const [lastDragX, setLastDragX] = useState(0);
  const [lastDragTime, setLastDragTime] = useState(0);
  
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    setPreviousDeltaX(0);
    setDragVelocity(0);
    setLastDragX(e.clientX);
    setLastDragTime(performance.now());
    
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
    
    const currentTime = performance.now();
    const timeElapsed = currentTime - lastDragTime;
    
    // Only update if meaningful time has passed
    if (timeElapsed > 16) { // roughly 60fps
      const currentX = e.clientX;
      const instantVelocity = (currentX - lastDragX) / Math.max(timeElapsed, 1);
      
      // Update velocity with smoothing (increased smoothing factor)
      setDragVelocity(prev => prev * 0.8 + instantVelocity * 0.2);
      
      // Update last positions
      setLastDragX(currentX);
      setLastDragTime(currentTime);
    }
    
    const deltaX = e.clientX - dragStartX;
    
    // Apply progressive smoothing for more stability at higher speeds
    const smoothingFactor = Math.min(0.9, Math.max(0.5, 0.7 - Math.abs(deltaX) / 1000));
    const smoothedDeltaX = previousDeltaX * smoothingFactor + deltaX * (1 - smoothingFactor);
    setPreviousDeltaX(smoothedDeltaX);
    
    // More controlled amplitude calculation with better constraints
    const amplitude = Math.min(Math.max(Math.abs(smoothedDeltaX) / 120, 0.15), 0.95);
    
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
    
    // Determine oscillation speed based on drag velocity
    // Cap the velocity influence to prevent extremely fast oscillations
    const velocityFactor = Math.min(Math.abs(dragVelocity) * 10, 15);
    const baseSpeed = 1.0; // Use a consistent base speed
    
    // Scale the speed more appropriately (reduced maximum speed)
    const speedAdjustment = Math.min(Math.max(velocityFactor, 0.5), 1.5);
    
    // Lower threshold to start oscillating for better responsiveness
    if (currentTrack && Math.abs(currentTrack.position) > 0.02) {
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { 
                ...track, 
                oscillating: true,
                // Adjust speed based on how fast the user was dragging (with capping)
                speed: baseSpeed * speedAdjustment,
                // Ensure initial direction is based on the drag motion
                direction: dragVelocity > 0 ? 'left-to-right' : 'right-to-left'
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
    setDragVelocity(0);
  };
  
  return {
    isDragging,
    dragTrackId,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
