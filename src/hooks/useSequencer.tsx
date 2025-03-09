import { useState, useEffect } from 'react';
import useTone from './useTone';
import { useSequencerAnimation } from './useSequencerAnimation';
import { useSequencerDrag } from './useSequencerDrag';
import { createInitialTracks } from '@/utils/sequencerUtils';
import { TrackData } from '@/types/sequencer';

// Use 'export type' instead of just 'export' for re-exporting types
export type { TrackData } from '@/types/sequencer';

export function useSequencer() {
  const [tracks, setTracks] = useState<TrackData[]>(createInitialTracks());
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [recentlyTriggered, setRecentlyTriggered] = useState<number[]>([]);
  
  // Default to -15dB for a better starting volume
  const { setMasterVolume, masterVolume, setBpm: setToneBpm } = useTone();
  
  // Initialize the BPM in Tone.js
  useEffect(() => {
    setToneBpm(bpm);
  }, [bpm, setToneBpm]);

  // Set initial volume if needed
  useEffect(() => {
    if (masterVolume === 0) {
      setMasterVolume(-15); // Set a default value that's not too loud
    }
  }, [masterVolume, setMasterVolume]);
  
  // Initialize animation
  const { animationRef } = useSequencerAnimation({
    tracks,
    setTracks,
    isPlaying,
    setRecentlyTriggered,
    bpm
  });
  
  // Initialize drag handling with expanded bounds
  const {
    isDragging,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useSequencerDrag({
    tracks,
    setTracks,
    isPlaying,
    setIsPlaying
  });
  
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
    setTracks(createInitialTracks());
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
