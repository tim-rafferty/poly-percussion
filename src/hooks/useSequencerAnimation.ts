import { useRef, useEffect } from 'react';
import { TrackData } from '@/types/sequencer';
import useTone from './useTone';

interface UseSequencerAnimationProps {
  tracks: TrackData[];
  setTracks: React.Dispatch<React.SetStateAction<TrackData[]>>;
  isPlaying: boolean;
  setRecentlyTriggered: React.Dispatch<React.SetStateAction<number[]>>;
  bpm: number;
}

export const useSequencerAnimation = ({
  tracks,
  setTracks,
  isPlaying,
  setRecentlyTriggered,
  bpm
}: UseSequencerAnimationProps) => {
  const animationRef = useRef<number | null>(null);
  const { playSound, startTransport, stopTransport, getCurrentTime } = useTone();
  const lastUpdateRef = useRef<number>(0);
  const lastTriggerTimesRef = useRef<Record<number, number>>({});
  const oscillationStatesRef = useRef<Record<number, { 
    phase: number, 
    direction: string, 
    beatCount: number,
    isDragging: boolean,
    hasTriggeredSinceDrag: boolean 
  }>>({});
  
  const animateNodes = () => {
    const now = getCurrentTime();
    const elapsedTime = now - lastUpdateRef.current;
    lastUpdateRef.current = now;
    
    // Calculate the master speed multiplier based on BPM
    // Base speed at 120 BPM, scale proportionally
    // Multiply by 2 to double the speed
    const masterSpeedMultiplier = (bpm / 120) * 2;
    
    // Limit update rate for smoother, more consistent animation
    if (elapsedTime > 0.005) {
      const newTriggered: number[] = [];
      
      setTracks(prevTracks => {
        return prevTracks.map(track => {
          if (!track.oscillating) return track;
          
          // Initialize track oscillation state if needed
          if (!oscillationStatesRef.current[track.id]) {
            oscillationStatesRef.current[track.id] = {
              phase: track.direction === 'right-to-left' ? Math.PI : 0,
              direction: track.direction,
              beatCount: 0,
              isDragging: track.isDragging || false,
              hasTriggeredSinceDrag: false
            };
          }
          
          const state = oscillationStatesRef.current[track.id];
          
          // Update dragging state
          if (track.isDragging !== state.isDragging) {
            state.isDragging = track.isDragging;
            if (track.isDragging) {
              state.hasTriggeredSinceDrag = false;
              state.beatCount = 0;
            }
          }
          
          // Calculate phase increment based on speed and time signature
          // Slower phase increment for higher time signatures
          const phaseIncrement = elapsedTime * track.speed * masterSpeedMultiplier * 2.5;
          state.phase += phaseIncrement;
          
          // More stable sine wave calculation
          const newPosition = track.amplitude * Math.sin(state.phase);
          
          // More reliable zero crossing detection
          const previousPosition = track.position;
          const crossingPositive = previousPosition <= 0 && newPosition > 0;
          const crossingNegative = previousPosition >= 0 && newPosition < 0;
          
          let shouldTrigger = false;
          let newDirection = track.direction;
          
          // Update direction and handle beat counting based on zero crossings
          if (crossingPositive || crossingNegative) {
            // Only start counting beats after the first trigger post-drag
            if (!state.hasTriggeredSinceDrag) {
              state.hasTriggeredSinceDrag = true;
              state.beatCount = 0;
              shouldTrigger = true;
            } else {
              state.beatCount = (state.beatCount + 1) % track.timeSignature;
              shouldTrigger = state.beatCount === 0;
            }

            if (crossingPositive) {
              newDirection = 'left-to-right';
            } else {
              newDirection = 'right-to-left';
            }
            state.direction = newDirection;
          }
          
          // Get last trigger time for debouncing
          const lastTriggerTime = lastTriggerTimesRef.current[track.id] || 0;
          
          // Enforce minimum time between triggers (prevents double-triggering)
          // Scale the minimum time between triggers based on BPM to maintain consistency
          const minTimeBetweenTriggers = 0.3 * (120 / bpm);
          
          if (shouldTrigger && !track.muted && (now - lastTriggerTime > minTimeBetweenTriggers)) {
            playSound(
              track.sample,
              track.decay,
              track.volume,
              track.pitch,
              track.id,
              track.delayEnabled ? {
                enabled: true,
                time: track.delayTime,
                feedback: track.delayFeedback,
                mix: track.delayMix
              } : undefined,
              track.customSample?.enabled ? {
                buffer: track.customSample.buffer,
                originalPitch: track.customSample.originalPitch
              } : undefined
            );
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
          const updated = [...prev, ...newTriggered];
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
      // Reset beat counts when stopping
      oscillationStatesRef.current = {};
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, startTransport, stopTransport, bpm]);
  
  return { animationRef };
};
