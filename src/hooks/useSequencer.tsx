
import { useState, useEffect, useRef } from 'react';
import useTone from './useTone';

export type TrackData = {
  id: number;
  color: string;
  active: boolean;
  position: number;
  amplitude: number;
  speed: number;
  timeSignature: number;
  volume: number;
  attack: number;
  decay: number;
  sample: 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'rim' | 'cowbell' | 'cymbal';
  muted: boolean;
  soloed: boolean;
  oscillating: boolean;
  lastTriggerTime: number;
  direction: 'left-to-right' | 'right-to-left'; // Track direction for triggering
};

const TRACK_COLORS = [
  '#4AE0B8', // mint
  '#E08D7F', // coral
  '#E0E04A', // yellow
  '#4AE04A', // green
  '#4ACCE0', // teal
  '#E04A4A', // red
  '#FFFFFF', // white
  '#4AE07F', // light green
];

const INITIAL_TRACKS: TrackData[] = Array(8).fill(null).map((_, i) => ({
  id: i,
  color: TRACK_COLORS[i],
  active: false,
  position: 0,
  amplitude: 0,
  speed: 1 + (i * 0.25),
  timeSignature: 4,
  volume: -10,
  attack: 0.01,
  decay: 0.5,
  sample: i % 8 === 0 ? 'kick' : 
          i % 8 === 1 ? 'snare' : 
          i % 8 === 2 ? 'hihat' : 
          i % 8 === 3 ? 'clap' : 
          i % 8 === 4 ? 'tom' : 
          i % 8 === 5 ? 'rim' : 
          i % 8 === 6 ? 'cowbell' : 'cymbal',
  muted: false,
  soloed: false,
  oscillating: false,
  lastTriggerTime: 0,
  direction: 'left-to-right'
}));

export function useSequencer() {
  const [tracks, setTracks] = useState<TrackData[]>(INITIAL_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTrackId, setDragTrackId] = useState<number | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [recentlyTriggered, setRecentlyTriggered] = useState<number[]>([]);
  
  const animationRef = useRef<number | null>(null);
  const { playSound, setBpm: setToneBpm, startTransport, stopTransport, getCurrentTime, masterVolume, setMasterVolume } = useTone();
  
  useEffect(() => {
    setToneBpm(bpm);
  }, [bpm, setToneBpm]);
  
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
  
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    
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
    
    const deltaX = e.clientX - dragStartX;
    // More controlled amplitude calculation with better constraints
    const amplitude = Math.min(Math.max(Math.abs(deltaX) / 100, 0.1), 1.0);
    
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
    
    // Lower threshold to start oscillating for better responsiveness
    if (currentTrack && Math.abs(currentTrack.position) > 0.02) {
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { 
                ...track, 
                oscillating: true,
                // Ensure initial direction is set for immediate triggering
                direction: track.position > 0 ? 'right-to-left' : 'left-to-right'
              }
            : track
        )
      );
      
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
    
    setDragTrackId(null);
  };
  
  const updateTrackParam = <K extends keyof TrackData>(trackId: number, param: K, value: TrackData[K]) => {
    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId
          ? { ...track, [param]: value }
          : track
      )
    );
  };
  
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };
  
  const resetTracks = () => {
    setTracks(INITIAL_TRACKS);
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  return {
    tracks,
    selectedTrackId,
    setSelectedTrackId,
    isPlaying,
    bpm,
    setBpm,
    isDragging,
    recentlyTriggered,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp,
    updateTrackParam,
    togglePlay,
    resetTracks,
    masterVolume,
    setMasterVolume
  };
}
