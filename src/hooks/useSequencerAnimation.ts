
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
  const oscillationStatesRef = useRef<Record<number, { phase: number, lastDirection: string }>>({});
  
  const animateNodes = () => {
    const now = getCurrentTime();
    const timeElapsed = now - lastUpdateRef.current;
    lastUpdateRef.current = now;
    
    const newRecentlyTriggered: number[] = [];
    
    setTracks(prevTracks => {
      return prevTracks.map(track => {
        if (!track.oscillating) return track;
        
        // Initialize track oscillation state if not exists
        if (!oscillationStatesRef.current[track.id]) {
          oscillationStatesRef.current[track.id] = {
            phase: track.direction === 'right-to-left' ? Math.PI : 0,
            lastDirection: track.direction
          };
        }
        
        const trackState = oscillationStatesRef.current[track.id];
        
        // Increment phase based on time and speed (with lower speed multiplier)
        // This gives us more control over the oscillation cycle
        trackState.phase += timeElapsed * track.speed * 2.5;
        
        // Calculate new position using the continuously incrementing phase
        // This prevents jumps in the sine wave
        const newPosition = track.amplitude * Math.sin(trackState.phase);
        
        // Track zero crossings for trigger detection
        // This logic detects when the sine wave crosses zero
        const wasPositive = track.position > 0;
        const wasNegative = track.position < 0;
        const isPositive = newPosition > 0;
        const isNegative = newPosition < 0;
        
        let shouldTrigger = false;
        let newDirection = track.direction;
        
        // Detect zero crossing (direction change)
        if (wasPositive && isNegative) {
          shouldTrigger = true;
          newDirection = 'right-to-left';
        } else if (wasNegative && isPositive) {
          shouldTrigger = true;
          newDirection = 'left-to-right';
        }
        
        // Only update direction in state if it actually changed
        if (newDirection !== trackState.lastDirection) {
          trackState.lastDirection = newDirection;
        }
        
        // Get the last trigger time for this track
        const lastTriggerTime = lastTriggerTimesRef.current[track.id] || 0;
        
        // Enforce a minimum time between triggers (increased to prevent rapid triggering)
        const minTimeBetweenTriggers = 0.5; // Half a second minimum between triggers
        
        if (shouldTrigger && !track.muted && (now - lastTriggerTime > minTimeBetweenTriggers)) {
          playSound(track.sample, track.decay, track.volume);
          newRecentlyTriggered.push(track.id);
          // Update the last trigger time for this track
          lastTriggerTimesRef.current[track.id] = now;
          
          return {
            ...track,
            position: newPosition,
            direction: newDirection
          };
        }
        
        return {
          ...track,
          position: newPosition,
          direction: newDirection
        };
      });
    });
    
    if (newRecentlyTriggered.length > 0) {
      setRecentlyTriggered(prev => {
        const updated = [...prev, ...newRecentlyTriggered];
        // Clear trigger visual effect after a short delay
        setTimeout(() => {
          setRecentlyTriggered(current => 
            current.filter(id => !newRecentlyTriggered.includes(id))
          );
        }, 150);
        return updated;
      });
    }
    
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
