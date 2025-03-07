
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
      
      // Update velocity with increased smoothing for stability
      setDragVelocity(prev => prev * 0.85 + instantVelocity * 0.15);
      
      // Update last positions
      setLastDragX(currentX);
      setLastDragTime(currentTime);
    }
    
    const deltaX = e.clientX - dragStartX;
    
    // Apply progressive smoothing for better stability at all speeds
    const smoothingFactor = Math.min(0.9, Math.max(0.6, 0.75 - Math.abs(deltaX) / 1000));
    const smoothedDeltaX = previousDeltaX * smoothingFactor + deltaX * (1 - smoothingFactor);
    setPreviousDeltaX(smoothedDeltaX);
    
    // More constrained amplitude calculation for better control
    // Higher min value makes it easier to start oscillation
    // Lower max value prevents extreme oscillations
    const amplitude = Math.min(Math.max(Math.abs(smoothedDeltaX) / 150, 0.2), 0.85);
    
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === dragTrackId 
          ? { 
              ...track, 
              amplitude,
              // Smoother initial position with constrained movement
              position: deltaX > 0 ? amplitude * 0.5 : -amplitude * 0.5 
            } 
          : track
      )
    );
  };
  
  const handleMouseUp = () => {
    if (!isDragging || dragTrackId === null) return;
    
    const currentTrack = tracks.find(track => track.id === dragTrackId);
    
    setIsDragging(false);
    
    // More conservative speed calculation based on drag velocity
    // Hard cap the maximum speed to prevent uncontrollable oscillations
    const maxSpeed = 1.2; // Cap the maximum speed
    const minSpeed = 0.8; // Ensure minimum responsiveness
    
    // Very conservative velocity scaling to prevent extreme speeds
    const velocityFactor = Math.min(Math.abs(dragVelocity) * 5, 3);
    
    // Calculate speed with tight constraints
    const speed = Math.min(Math.max(minSpeed, velocityFactor * 0.4), maxSpeed);
    
    // Calculate initial direction from drag direction, not velocity
    // This feels more intuitive to users
    const dragDirection = previousDeltaX > 0 ? 'left-to-right' : 'right-to-left';
    
    // Lower threshold to start oscillating for better responsiveness
    if (currentTrack && Math.abs(currentTrack.position) > 0.02) {
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { 
                ...track, 
                oscillating: true,
                speed: speed,
                direction: dragDirection
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
