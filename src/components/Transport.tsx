import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransportProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  onReset: () => void;
  masterVolume: number;
  onChangeMasterVolume: (volume: number) => void;
}

const Transport: React.FC<TransportProps> = ({
  isPlaying,
  onTogglePlay,
  bpm,
  onChangeBpm,
  onReset,
  masterVolume,
  onChangeMasterVolume
}) => {
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isDraggingTempo, setIsDraggingTempo] = useState(false);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, type: 'volume' | 'tempo') => {
    e.preventDefault();
    if (type === 'volume') {
      setIsDraggingVolume(true);
      startValue.current = masterVolume;
    } else {
      setIsDraggingTempo(true);
      startValue.current = bpm;
    }
    startY.current = e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY.current - e.clientY;
      
      if (type === 'volume') {
        const volumeChange = Math.round(deltaY * 0.2); // Adjust volume sensitivity
        const newVolume = Math.min(0, Math.max(-60, startValue.current + volumeChange));
        onChangeMasterVolume(newVolume);
      } else {
        const tempoChange = Math.round(deltaY * 0.5); // Adjust tempo sensitivity
        const newTempo = Math.min(240, Math.max(40, startValue.current + tempoChange));
        onChangeBpm(newTempo);
      }
    };

    const handleMouseUp = () => {
      if (type === 'volume') {
        setIsDraggingVolume(false);
      } else {
        setIsDraggingTempo(false);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [masterVolume, bpm, onChangeMasterVolume, onChangeBpm]);

  return (
    <div className="w-full flex justify-between items-center mb-8 animate-fade-in">
      <div className="text-3xl font-bold text-white">PolyPerc</div>
      <div className="flex items-center space-x-4">
        <Button 
          onClick={onTogglePlay}
          className={cn(
            "px-6 h-10 flex items-center space-x-2 transition-all duration-300",
            isPlaying 
              ? "bg-red-500/80 hover:bg-red-600 text-white" 
              : "bg-green-500/80 hover:bg-green-600 text-white"
          )}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Play</span>
            </>
          )}
        </Button>
        
        <div 
          className={cn(
            "flex items-center space-x-3 bg-black/40 rounded-md px-3 py-2 backdrop-blur-md",
            isDraggingTempo ? "cursor-ns-resize" : "cursor-pointer"
          )}
        >
          <span className="text-white text-sm font-medium">BPM:</span>
          <div 
            className="w-16 text-center px-2 py-1 bg-black/50 text-white rounded border border-white/20"
            onMouseDown={(e) => handleMouseDown(e, 'tempo')}
          >
            {bpm}
          </div>
        </div>
        
        <div 
          className={cn(
            "flex items-center space-x-3 bg-black/40 rounded-md px-3 py-2 backdrop-blur-md",
            isDraggingVolume ? "cursor-ns-resize" : "cursor-pointer"
          )}
        >
          <Volume2 className="w-4 h-4 text-white/70" />
          <div 
            className="w-16 text-center px-2 py-1 bg-black/50 text-white rounded border border-white/20"
            onMouseDown={(e) => handleMouseDown(e, 'volume')}
          >
            {masterVolume}dB
          </div>
        </div>
        
        <Button 
          onClick={onReset}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
};

export default Transport;
