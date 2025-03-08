
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
    e.stopPropagation();
    
    // Find the track to work with
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    setLastDragX(e.clientX);
    setLastDragTime(performance.now());
    setDragVelocity(0);
    
    // Get container reference for boundary calculation
    if (!containerRef.current) {
      containerRef.current = document.querySelector('.glass-panel.h-\\[75vh\\]') as HTMLDivElement;
    }
    
    // Stop oscillation during drag
    setTracks(prevTracks => 
      prevTracks.map(t => 
        t.id === trackId 
          ? { ...t, oscillating: false } 
          : t
      )
    );
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDragging || dragTrackId === null) return;
    
    // Throttle mouse move updates for better performance
    const currentTime = performance.now();
    const timeDelta = currentTime - lastDragTime;
    
    // Skip updates that are too close together
    if (timeDelta < 16) return; // ~60 fps max update rate
    
    // Get container dimensions for bounds
    let containerWidth = 800;
    let maxAmplitude = 1.0;
    
    if (containerRef.current) {
      containerWidth = containerRef.current.clientWidth;
      // Limit max drag to 45% of container width
      maxAmplitude = containerWidth * 0.45 / 150;
    }
    
    // Calculate delta from current drag position
    const deltaX = e.clientX - lastDragX;
    
    // Calculate smooth velocity using exponential moving average
    const instantVelocity = deltaX / Math.max(timeDelta, 1);
    const smoothingFactor = 0.2; // Lower = more smoothing
    const newVelocity = (dragVelocity * (1 - smoothingFactor)) + (instantVelocity * smoothingFactor);
    setDragVelocity(newVelocity);
    
    // Calculate total movement from start position
    const totalDeltaX = e.clientX - dragStartX;
    
    // Map screen pixels to amplitude value with reasonable limits
    const pixelToAmplitudeRatio = 150;
    const rawAmplitude = Math.min(
      Math.abs(totalDeltaX) / pixelToAmplitudeRatio, 
      maxAmplitude
    );
    
    // Calculate position based on drag direction
    const position = totalDeltaX > 0 ? rawAmplitude : -rawAmplitude;
    
    // Update the track
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
  };
  
  const handleMouseUp = () => {
    if (!isDragging || dragTrackId === null) return;
    
    const track = tracks.find(t => t.id === dragTrackId);
    if (!track) {
      // Reset state if track not found
      setIsDragging(false);
      setDragTrackId(null);
      return;
    }
    
    // Only start oscillation if there was meaningful movement
    if (Math.abs(track.position) > 0.05) {
      // Map velocity to a reasonable speed range
      const absVelocity = Math.abs(dragVelocity);
      const minSpeed = 0.7;
      const maxSpeed = 2.0;
      const speedRange = maxSpeed - minSpeed;
      const speedFactor = Math.min(Math.max(absVelocity * 0.01, 0), 1);
      const calculatedSpeed = minSpeed + (speedFactor * speedRange);
      
      // Start oscillation with calculated parameters
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
