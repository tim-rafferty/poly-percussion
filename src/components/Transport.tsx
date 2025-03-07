
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransportProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  onReset: () => void;
}

const Transport: React.FC<TransportProps> = ({
  isPlaying,
  onTogglePlay,
  bpm,
  onChangeBpm,
  onReset
}) => {
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
        
        <div className="flex items-center space-x-3 bg-black/40 rounded-md px-3 py-2 backdrop-blur-md">
          <span className="text-white text-sm font-medium">BPM:</span>
          <input 
            type="number" 
            min="40" 
            max="240"
            value={bpm}
            onChange={(e) => onChangeBpm(Number(e.target.value))}
            className="w-16 text-center px-2 py-1 bg-black/50 text-white rounded border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/30"
          />
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
