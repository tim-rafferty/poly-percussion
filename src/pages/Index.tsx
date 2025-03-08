
import React, { useEffect, useState } from 'react';
import { useSequencer } from '@/hooks/useSequencer';
import SequencerNode from '@/components/SequencerNode';
import TrackSelector from '@/components/TrackSelector';
import ParameterOverlay from '@/components/ParameterOverlay';
import Transport from '@/components/Transport';
import { toast } from '@/components/ui/use-toast';
import { ArrowUpDown } from 'lucide-react';

const Index = () => {
  const [showParameterOverlay, setShowParameterOverlay] = useState(false);
  
  const {
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
    setMasterVolume,
    containerRef
  } = useSequencer();

  useEffect(() => {
    // Show welcome toast when component mounts
    toast({
      title: "Welcome to PolyPerc",
      description: "Drag the nodes horizontally to create polyrhythmic patterns",
      duration: 5000,
    });
  }, []);

  const handleTrackParamUpdate = <K extends keyof typeof tracks[0]>(
    param: K, 
    value: typeof tracks[0][K]
  ) => {
    if (selectedTrackId !== null) {
      updateTrackParam(selectedTrackId, param, value);
    }
  };

  // Handlers for mouse events
  const handleMouseMoveEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMove(e);
  };

  const handleMouseUpEvent = () => {
    handleMouseUp();
  };

  const handleMouseLeaveEvent = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };
  
  // Handle track selection
  const handleTrackSelect = (trackId: number) => {
    setSelectedTrackId(trackId);
    setShowParameterOverlay(true);
  };
  
  // Close overlay
  const handleCloseOverlay = () => {
    setShowParameterOverlay(false);
  };

  return (
    <div 
      className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-background to-black p-4 lg:p-8 overflow-hidden"
      onMouseMove={handleMouseMoveEvent}
      onMouseUp={handleMouseUpEvent}
      onMouseLeave={handleMouseLeaveEvent}
    >
      {/* Top controls */}
      <Transport 
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        bpm={bpm}
        onChangeBpm={setBpm}
        onReset={resetTracks}
        masterVolume={masterVolume}
        onChangeMasterVolume={setMasterVolume}
      />
      
      {/* Main sequencer area */}
      <div 
        ref={containerRef}
        className="flex-1 w-full flex justify-center items-center relative glass-panel h-[75vh] my-6 overflow-hidden"
      >
        <div className="center-line"></div>
        
        {tracks.map((track, index) => (
          <SequencerNode
            key={track.id}
            track={track}
            index={index}
            totalTracks={tracks.length}
            onMouseDown={handleNodeMouseDown}
            isTriggered={recentlyTriggered.includes(track.id)}
          />
        ))}
        
        {/* Instructions overlay */}
        {!isPlaying && tracks.every(t => !t.oscillating) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <ArrowUpDown className="w-12 h-12 text-white/70 mb-4 animate-pulse" />
            <p className="text-white/80 text-xl font-light">Drag any node to create a rhythm</p>
            <p className="text-white/60 text-sm mt-2">Use the track selectors below to configure sounds</p>
          </div>
        )}
      </div>
      
      {/* Track selection panel with much smaller height */}
      <div className="w-full glass-panel p-2 rounded-xl h-[10vh] overflow-hidden relative">
        <TrackSelector 
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          onSelectTrack={handleTrackSelect}
        />
        
        {/* Parameter overlay appears when a track is selected */}
        {showParameterOverlay && selectedTrackId !== null && (
          <ParameterOverlay 
            track={tracks[selectedTrackId]}
            onUpdateParam={handleTrackParamUpdate}
            onClose={handleCloseOverlay}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
