
import { useRef, useEffect } from 'react';
import { TrackData } from '@/types/sequencer';
import useTone from './useTone';

interface UseSequencerAnimationProps {
  tracks: TrackData[];
  setTracks: React.Dispatch<React.SetStateAction<TrackData[]>>;
  isPlaying: boolean;
  setRecentlyTriggered: React.Dispatch<React.SetStateAction<number[]>>;
}

export const useSequencerAnimation = ({
  tracks,
  setTracks,
  isPlaying,
  setRecentlyTriggered
}: UseSequencerAnimationProps) => {
  const animationRef = useRef<number | null>(null);
  const { playSound, startTransport, stopTransport, getCurrentTime } = useTone();
  const lastUpdateRef = useRef<number>(0);
  const lastTriggerTimesRef = useRef<Record<number, number>>({});
  const oscillationStatesRef = useRef<Record<number, { phase: number, direction: string }>>({});
  
  const animateNodes = () => {
    const now = getCurrentTime();
    const elapsedTime = now - lastUpdateRef.current;
    lastUpdateRef.current = now;
    
    // Limit update rate for smoother, more consistent animation
    // Only perform state updates if meaningful time has passed
    if (elapsedTime > 0.005) { // ~5ms minimum time step
      const newTriggered: number[] = [];
      
      setTracks(prevTracks => {
        return prevTracks.map(track => {
          if (!track.oscillating) return track;
          
          // Initialize track oscillation state if needed
          if (!oscillationStatesRef.current[track.id]) {
            oscillationStatesRef.current[track.id] = {
              phase: track.direction === 'right-to-left' ? Math.PI : 0,
              direction: track.direction
            };
          }
          
          const state = oscillationStatesRef.current[track.id];
          
          // Smoother phase progression based on elapsed time and speed
          // Consistent time-based animation regardless of frame rate
          state.phase += elapsedTime * track.speed * 2.5;
          
          // More stable sine wave calculation
          const newPosition = track.amplitude * Math.sin(state.phase);
          
          // More reliable zero crossing detection
          const previousPosition = track.position;
          const crossingPositive = previousPosition <= 0 && newPosition > 0;
          const crossingNegative = previousPosition >= 0 && newPosition < 0;
          
          let shouldTrigger = false;
          let newDirection = track.direction;
          
          // Update direction based on zero crossing
          if (crossingPositive) {
            shouldTrigger = true;
            newDirection = 'left-to-right';
            state.direction = newDirection;
          } else if (crossingNegative) {
            shouldTrigger = true;
            newDirection = 'right-to-left';
            state.direction = newDirection;
          }
          
          // Get last trigger time for debouncing
          const lastTriggerTime = lastTriggerTimesRef.current[track.id] || 0;
          
          // Enforce minimum time between triggers (prevents double-triggering)
          const minTimeBetweenTriggers = 0.3; // 300ms minimum between triggers
          
          if (shouldTrigger && !track.muted && (now - lastTriggerTime > minTimeBetweenTriggers)) {
            playSound(track.sample, track.decay, track.volume);
            newTriggered.push(track.id);
            lastTriggerTimesRef.current[track.id] = now;
          }
          
          return {
            ...track,
            position: newPosition,
            direction: newDirection
          };
        });
      });
      
      // Batch trigger visual effects for better performance
      if (newTriggered.length > 0) {
        setRecentlyTriggered(prev => {
          // Add new triggers
          const updated = [...prev, ...newTriggered];
          
          // Schedule cleanup with a single timeout for better performance
          setTimeout(() => {
            setRecentlyTriggered(current => 
              current.filter(id => !newTriggered.includes(id))
            );
          }, 150);
          
          return updated;
        });
      }
    }
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(animateNodes);
  };
  
  useEffect(() => {
    if (isPlaying) {
      startTransport();
      if (!animationRef.current) {
        lastUpdateRef.current = getCurrentTime();
        animationRef.current = requestAnimationFrame(animateNodes);
      }
    } else {
      stopTransport();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, startTransport, stopTransport]);
  
  return { animationRef };
};
