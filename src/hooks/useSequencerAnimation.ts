
import { useRef, useEffect } from 'react';
import { TrackData } from '@/types/sequencer';

interface UseSequencerAnimationProps {
  tracks: TrackData[];
  setTracks: React.Dispatch<React.SetStateAction<TrackData[]>>;
  isPlaying: boolean;
  setRecentlyTriggered: React.Dispatch<React.SetStateAction<number[]>>;
  playSound: (sampleName: any, duration: number, volume: number) => void;
}

export const useSequencerAnimation = ({
  tracks,
  setTracks,
  isPlaying,
  setRecentlyTriggered,
  playSound
}: UseSequencerAnimationProps) => {
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const lastPositionsRef = useRef<{[key: number]: number}>({});
  const triggerDebounceRef = useRef<{[key: number]: number}>({});
  
  // Animation loop for all tracks
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    // Initialize last positions on first run
    if (Object.keys(lastPositionsRef.current).length === 0) {
      tracks.forEach(track => {
        lastPositionsRef.current[track.id] = track.position;
      });
    }
    
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;
      
      // Skip first frame or if too little time has passed
      if (deltaTime < 5 || lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Update time reference
      lastFrameTimeRef.current = timestamp;
      
      // Cap deltaTime to avoid large jumps
      const smoothDeltaTime = Math.min(deltaTime, 33); // ~30fps minimum
      
      // Convert to time factor (60fps equivalent)
      const timeFactor = smoothDeltaTime / 16.67;
      
      // Tracking for sound triggers
      const triggered: number[] = [];
      
      // Check for soloed tracks
      const hasSoloedTracks = tracks.some(t => t.soloed);
      
      setTracks(prevTracks => 
        prevTracks.map(track => {
          if (!track.oscillating) return track;
          
          // Calculate new position based on oscillation parameters
          const { id, direction, speed, amplitude } = track;
          const now = Date.now();
          
          // Use a stable frequency calculation
          const frequencyFactor = 0.005 * speed;
          const newPosition = 
            direction === 'left-to-right' 
              ? Math.sin(now * frequencyFactor) * amplitude
              : -Math.sin(now * frequencyFactor) * amplitude;
          
          // Get the last known position for zero crossing detection
          const lastPosition = lastPositionsRef.current[id] || 0;
          
          // Check for zero crossing (trigger point)
          const crossedPositive = lastPosition <= 0 && newPosition > 0;
          const crossedNegative = lastPosition >= 0 && newPosition < 0;
          
          // Update position reference for next frame
          lastPositionsRef.current[id] = newPosition;
          
          // Debounce triggers to prevent glitches
          const triggerDebounceTime = triggerDebounceRef.current[id] || 0;
          const timeSinceLastTrigger = now - triggerDebounceTime;
          
          // Only trigger if enough time has passed (prevents double-triggers)
          const minTriggerInterval = 200; // ms
          const canTrigger = timeSinceLastTrigger > minTriggerInterval;
          
          // Determine if sound should play (considering mute/solo states)
          const shouldPlaySound = 
            (crossedPositive || crossedNegative) && 
            canTrigger &&
            !track.muted && 
            (!hasSoloedTracks || track.soloed);
          
          if (shouldPlaySound) {
            triggered.push(id);
            triggerDebounceRef.current[id] = now;
            
            // Play the sound
            if (playSound) {
              playSound(
                track.sample, 
                track.decay, 
                track.volume
              );
            }
            
            // Update last trigger time
            return {
              ...track,
              position: newPosition,
              lastTriggerTime: now
            };
          }
          
          // Just update position
          return {
            ...track,
            position: newPosition
          };
        })
      );
      
      // Update visual feedback for triggered tracks
      if (triggered.length > 0) {
        setRecentlyTriggered(triggered);
        
        // Clear triggered state after visual feedback duration
        setTimeout(() => {
          setRecentlyTriggered(prevTriggered => 
            prevTriggered.filter(id => !triggered.includes(id))
          );
        }, 150);
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, tracks, setTracks, setRecentlyTriggered, playSound]);
  
  return { animationRef };
};
