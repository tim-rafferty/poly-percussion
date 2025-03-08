
import { useState, useRef } from 'react';
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
  const [lastDragX, setLastDragX] = useState(0);
  const [lastDragTime, setLastDragTime] = useState(0);
  const [dragVelocity, setDragVelocity] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: number, containerElement?: HTMLDivElement | null) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    setLastDragX(e.clientX);
    setLastDragTime(performance.now());
    setDragVelocity(0);
    
    // Store the container reference for calculating boundaries
    if (containerElement) {
      containerRef.current = containerElement;
    }
    
    // Stop oscillation during drag but remember the track's state
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
    const deltaTime = currentTime - lastDragTime;
    
    // Only update position on meaningful time intervals for smoother updates
    if (deltaTime > 8) { // ~120fps update rate - faster updates for smoother motion
      const deltaX = e.clientX - dragStartX;
      const currentVelocity = (e.clientX - lastDragX) / deltaTime;
      
      // Apply smoother velocity tracking with less weight to instantaneous velocity
      setDragVelocity(prev => prev * 0.8 + currentVelocity * 0.2);
      
      // Get container width for calculating amplitude
      let containerWidth = 800; // Default fallback width
      if (containerRef.current) {
        containerWidth = containerRef.current.clientWidth;
      }
      
      // Calculate amplitude based on container width - now using the full width
      const maxDragDistance = containerWidth / 2;
      const normalizedDelta = deltaX / maxDragDistance;
      
      // Allow for higher amplitudes with bounds relative to container size
      const maxAmplitude = 2.0; // Allow for higher max amplitude
      const baseAmplitude = Math.min(Math.abs(normalizedDelta), maxAmplitude);
      const smoothedAmplitude = Math.max(baseAmplitude, 0.05); // Ensure minimum amplitude
      
      // Apply immediate visual feedback during drag
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { 
                ...track, 
                amplitude: smoothedAmplitude,
                position: deltaX > 0 ? smoothedAmplitude * 0.8 : -smoothedAmplitude * 0.8 
              } 
            : track
        )
      );
      
      // Update tracking values
      setLastDragX(e.clientX);
      setLastDragTime(currentTime);
    }
  };
  
  const handleMouseUp = () => {
    if (!isDragging || dragTrackId === null) return;
    
    const track = tracks.find(t => t.id === dragTrackId);
    if (!track) {
      setIsDragging(false);
      setDragTrackId(null);
      return;
    }
    
    // More stable speed calculation with bounds
    const minSpeed = 0.7;
    const maxSpeed = 1.4;
    const velocityFactor = Math.abs(dragVelocity) * 2;
    const calculatedSpeed = Math.min(Math.max(minSpeed, velocityFactor * 0.3), maxSpeed);
    
    // Only start oscillation if there was meaningful movement
    if (Math.abs(track.position) > 0.01) {
      setTracks(prevTracks => 
        prevTracks.map(t => 
          t.id === dragTrackId 
            ? { 
                ...t, 
                oscillating: true,
                speed: calculatedSpeed,
                // Direction based on last position for more intuitive behavior
                direction: track.position >= 0 ? 'left-to-right' : 'right-to-left'
              }
            : t
        )
      );
      
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
    
    setIsDragging(false);
    setDragTrackId(null);
  };
  
  return {
    isDragging,
    dragTrackId,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp,
    containerRef
  };
};
