
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
  
  const animateNodes = () => {
    const now = getCurrentTime();
    const timeElapsed = now - lastUpdateRef.current;
    lastUpdateRef.current = now;
    
    const newRecentlyTriggered: number[] = [];
    
    setTracks(prevTracks => {
      return prevTracks.map(track => {
        if (!track.oscillating) return track;
        
        // Calculate a phase offset based on the track's direction to prevent immediate triggering
        const phaseOffset = track.direction === 'right-to-left' ? 0 : Math.PI;
        
        // Smoother oscillation with more predictable motion
        // Use track.speed to control frequency while maintaining amplitude
        const newPosition = track.amplitude * Math.sin((now * track.speed * 0.5) + phaseOffset);
        
        // Check if the node is crossing the center line
        const wasNegative = track.position < 0;
        const wasPositive = track.position > 0;
        const isNegative = newPosition < 0;
        const isPositive = newPosition > 0;
        
        let shouldTrigger = false;
        let newDirection = track.direction;
        
        // Trigger when crossing from right to left (positive to negative)
        if (wasPositive && isNegative) {
          shouldTrigger = true;
          newDirection = 'right-to-left';
        }
        // Also trigger when crossing from left to right (negative to positive)
        else if (wasNegative && isPositive) {
          shouldTrigger = true;
          newDirection = 'left-to-right';
        }
        
        // Get the last trigger time for this track, with a default if not set
        const lastTriggerTime = lastTriggerTimesRef.current[track.id] || 0;
        // Enforce a minimum time between triggers (in seconds)
        const minTimeBetweenTriggers = 0.3; // Increased from 0.1 to 0.3 seconds
        
        if (shouldTrigger && !track.muted && (now - lastTriggerTime > minTimeBetweenTriggers)) {
          playSound(track.sample, track.decay, track.volume);
          newRecentlyTriggered.push(track.id);
          // Update the last trigger time for this track
          lastTriggerTimesRef.current[track.id] = now;
          
          return {
            ...track,
            position: newPosition,
            lastTriggerTime: now,
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
