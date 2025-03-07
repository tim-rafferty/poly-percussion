
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
  lastTriggerTime: 0
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
  
  // Update Tone.js BPM when it changes
  useEffect(() => {
    setToneBpm(bpm);
  }, [bpm, setToneBpm]);
  
  // Animation loop for oscillating nodes
  const animateNodes = () => {
    const now = getCurrentTime();
    const newRecentlyTriggered: number[] = [];
    
    setTracks(prevTracks => {
      return prevTracks.map(track => {
        if (!track.oscillating) return track;
        
        // Calculate new position based on sine wave oscillation
        // Multiply by track.amplitude to get correct range of motion
        const newPosition = track.amplitude * Math.sin(now * track.speed * Math.PI * (track.timeSignature / 8));
        
        // Check if crossing the center line (trigger sound)
        const wasPositive = track.position >= 0;
        const isPositive = newPosition >= 0;
        
        // Only trigger on crossing from positive to negative
        if (wasPositive && !isPositive && !track.muted && now - track.lastTriggerTime > 0.1) {
          // Play sound
          playSound(track.sample, track.decay, track.volume);
          
          // Add to recently triggered array for visual feedback
          newRecentlyTriggered.push(track.id);
          
          return {
            ...track,
            position: newPosition,
            lastTriggerTime: now
          };
        }
        
        return {
          ...track,
          position: newPosition
        };
      });
    });
    
    // Update recently triggered for visual feedback
    if (newRecentlyTriggered.length > 0) {
      setRecentlyTriggered(prev => {
        const updated = [...prev, ...newRecentlyTriggered];
        // Clear the visual feedback after a brief delay
        setTimeout(() => {
          setRecentlyTriggered(current => 
            current.filter(id => !newRecentlyTriggered.includes(id))
          );
        }, 150);
        return updated;
      });
    }
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(animateNodes);
  };
  
  // Handle play/stop
  useEffect(() => {
    if (isPlaying) {
      startTransport();
      // Start animation for oscillating nodes
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
  
  // Handle mouse down on a node
  const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, trackId: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragTrackId(trackId);
    setDragStartX(e.clientX);
    
    // Pause oscillation while dragging
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, oscillating: false } 
          : track
      )
    );
  };
  
  // Handle mouse move while dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDragging || dragTrackId === null) return;
    
    const deltaX = e.clientX - dragStartX;
    // Increase the sensitivity of the dragging
    const amplitude = Math.min(Math.max(Math.abs(deltaX) / 100, 0), 1.5);
    
    setTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === dragTrackId 
          ? { 
              ...track, 
              amplitude, 
              position: Math.sign(deltaX) * amplitude  // Use deltaX to determine direction
            } 
          : track
      )
    );
  };
  
  // Handle mouse up after dragging
  const handleMouseUp = () => {
    if (!isDragging || dragTrackId === null) return;
    
    // Get the current track data
    const currentTrack = tracks.find(track => track.id === dragTrackId);
    
    setIsDragging(false);
    
    if (currentTrack && currentTrack.amplitude > 0.05) {
      // Start oscillation with current amplitude and direction
      setTracks(prevTracks => 
        prevTracks.map(track => 
          track.id === dragTrackId 
            ? { ...track, oscillating: true }
            : track
        )
      );
      
      // Start animation if not already running
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
    
    setDragTrackId(null);
  };
  
  // Update track parameters
  const updateTrackParam = <K extends keyof TrackData>(trackId: number, param: K, value: TrackData[K]) => {
    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId
          ? { ...track, [param]: value }
          : track
      )
    );
  };
  
  // Toggle play/stop
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };
  
  // Reset all tracks
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
