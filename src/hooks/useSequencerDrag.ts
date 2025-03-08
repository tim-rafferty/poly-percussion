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
  
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    setLastDragX(e.clientX);
    setLastDragTime(performance.now());
    setDragVelocity(0);
    
    // Store container reference for boundary calculation
    if (!containerRef.current) {
      containerRef.current = document.querySelector('.glass-panel.h-\\[75vh\\]') as HTMLDivElement;
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
      const deltaX = e.clientX - lastDragX;
      const currentVelocity = deltaX / Math.max(deltaTime, 1); // Avoid division by zero
      
      // Apply smoother velocity tracking with exponential smoothing
      // Lower alpha (0.1) means more smoothing, higher alpha means more responsive
      const alpha = 0.1;
      setDragVelocity(prev => (1 - alpha) * prev + alpha * currentVelocity);
      
      // Calculate container boundaries
      let containerWidth = 800; // Default fallback
      let maxDrag = 1.0; // Default max amplitude
      
      if (containerRef.current) {
        containerWidth = containerRef.current.clientWidth;
        maxDrag = containerWidth * 0.45 / 150; // Scale based on container width
      }
      
      // Calculate total delta from start
      const totalDeltaX = e.clientX - dragStartX;
      
      // Calculate amplitude - map screen pixels to amplitude value
      // Limit amplitude by container boundaries
      const rawAmplitude = Math.min(Math.abs(totalDeltaX) / 150, maxDrag);
      
      // Apply position immediately for responsive feel
      // Direction based on drag direction
      const position = totalDeltaX > 0 ? rawAmplitude : -rawAmplitude;
      
      // Update the track with new position value
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { 
                ...track,
                amplitude: rawAmplitude,
                position: position
              } 
            : track
        )
      );
      
      // Update tracking variables
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
    
    // Calculate final velocity and map to a speed value
    // Normalize velocity to a reasonable range
    const absVelocity = Math.abs(dragVelocity);
    
    // Map velocity to speed: faster drags = faster oscillation
    // But keep within reasonable bounds
    const minSpeed = 0.7;
    const maxSpeed = 2.0;
    const speedFactor = Math.min(Math.max(absVelocity * 0.01, 0), 1);
    const calculatedSpeed = minSpeed + speedFactor * (maxSpeed - minSpeed);
    
    // Only start oscillation if there was meaningful movement
    if (Math.abs(track.position) > 0.05) {
      setTracks(prevTracks => 
        prevTracks.map(t => 
          t.id === dragTrackId 
            ? { 
                ...t, 
                oscillating: true,
                speed: calculatedSpeed,
                direction: track.position >= 0 ? 'left-to-right' : 'right-to-left'
              }
            : t
        )
      );
      
      // Auto-start playback if not already playing
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragTrackId(null);
  };
  
  return {
    isDragging,
    dragTrackId,
    containerRef,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
