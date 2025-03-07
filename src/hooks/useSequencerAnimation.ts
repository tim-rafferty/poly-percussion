
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
  
  const animateNodes = () => {
    const now = getCurrentTime();
    const newRecentlyTriggered: number[] = [];
    
    setTracks(prevTracks => {
      return prevTracks.map(track => {
        if (!track.oscillating) return track;
        
        // Smoother oscillation with more predictable motion
        const newPosition = track.amplitude * Math.sin(now * track.speed * 0.75);
        
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
        
        if (shouldTrigger && !track.muted && now - track.lastTriggerTime > 0.1) {
          playSound(track.sample, track.decay, track.volume);
          newRecentlyTriggered.push(track.id);
          
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
