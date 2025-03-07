
import { useState, useEffect } from 'react';
import useTone from './useTone';
import { useSequencerAnimation } from './useSequencerAnimation';
import { useSequencerDrag } from './useSequencerDrag';
import { createInitialTracks } from '@/utils/sequencerUtils';
import { TrackData } from '@/types/sequencer';

export { TrackData } from '@/types/sequencer';

export function useSequencer() {
  const [tracks, setTracks] = useState<TrackData[]>(createInitialTracks());
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [recentlyTriggered, setRecentlyTriggered] = useState<number[]>([]);
  
  const { setMasterVolume, masterVolume, setBpm: setToneBpm } = useTone();
  
  // Initialize the BPM in Tone.js
  useEffect(() => {
    setToneBpm(bpm);
  }, [bpm, setToneBpm]);
  
  // Initialize animation
  const { animationRef } = useSequencerAnimation({
    tracks,
    setTracks,
    isPlaying,
    setRecentlyTriggered
  });
  
  // Initialize drag handling
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
