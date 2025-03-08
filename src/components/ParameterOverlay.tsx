
import React from 'react';
import { TrackData } from '@/hooks/useSequencer';
import { X } from 'lucide-react';

interface ParameterOverlayProps {
  track: TrackData;
  onClose: () => void;
  onUpdateParam: <K extends keyof TrackData>(param: K, value: TrackData[K]) => void;
}

const ParameterOverlay: React.FC<ParameterOverlayProps> = ({
  track,
  onClose,
  onUpdateParam
}) => {
  // Sample options for the dropdown
  const sampleOptions = [
    'kick', 'snare', 'hihat', 'clap', 'tom', 'rim', 'cowbell', 'cymbal'
  ];
  
  const filterOptions = ['low', 'medium', 'high'];

  // Find the current index of the sample
  const sampleIndex = sampleOptions.indexOf(track.sample);
  
  // Handler for slider-like dragging
  const handleDragParameter = <K extends keyof TrackData>(
    e: React.MouseEvent, 
    param: K, 
    currentValue: number, 
    min: number, 
    max: number, 
    step: number
  ) => {
    e.preventDefault();
    
    const startY = e.clientY;
    const startValue = currentValue;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      // Make it more sensitive for better control
      const newValue = Math.min(max, Math.max(min, startValue + (deltaY * step)));
      onUpdateParam(param, newValue as any);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handler for enumerated values like sample selection
  const handleDragOption = <K extends keyof TrackData>(
    e: React.MouseEvent,
    param: K,
    options: string[],
    currentIndex: number
  ) => {
    e.preventDefault();
    
    const startY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      // Change option every 20px of movement
      const indexChange = Math.floor(deltaY / 20);
      let newIndex = (currentIndex + indexChange) % options.length;
      if (newIndex < 0) newIndex = options.length + newIndex;
      
      if (options[newIndex] !== track[param]) {
        onUpdateParam(param, options[newIndex] as any);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#f1fab8] p-4 rounded-t-xl border-t border-black/10 shadow-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-black">Parameters</h3>
        <button 
          onClick={onClose}
          className="text-black hover:text-red-500 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-8 mt-4">
        {/* Sound Parameter */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">sound</div>
          <div 
            className="cursor-ns-resize flex flex-col items-center"
            onMouseDown={(e) => handleDragOption(e, 'sample', sampleOptions, sampleIndex)}
          >
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">{track.sample}</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
        
        {/* Time Parameter */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">time</div>
          <div 
            className="cursor-ns-resize flex flex-col items-center"
            onMouseDown={(e) => handleDragParameter(e, 'timeSignature', track.timeSignature, 1, 16, 1)}
          >
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">{track.timeSignature}/16</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
        
        {/* Speed Parameter */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">speed</div>
          <div 
            className="cursor-ns-resize flex flex-col items-center"
            onMouseDown={(e) => handleDragParameter(e, 'speed', track.speed, 0.5, 4, 0.1)}
          >
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">{(track.speed * 100).toFixed(0)}</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
        
        {/* Attack Parameter */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">attack</div>
          <div 
            className="cursor-ns-resize flex flex-col items-center"
            onMouseDown={(e) => handleDragParameter(e, 'attack', track.attack, 0.01, 1, 0.01)}
          >
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">{(track.attack * 100).toFixed(0)}</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
        
        {/* Decay Parameter */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">decay</div>
          <div 
            className="cursor-ns-resize flex flex-col items-center"
            onMouseDown={(e) => handleDragParameter(e, 'decay', track.decay, 0.1, 2, 0.1)}
          >
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">{(track.decay * 100).toFixed(0)}</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
        
        {/* Volume Parameter */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">volume</div>
          <div 
            className="cursor-ns-resize flex flex-col items-center"
            onMouseDown={(e) => handleDragParameter(e, 'volume', track.volume, -40, 0, 1)}
          >
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">{Math.abs(track.volume).toFixed(0)}</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
        
        {/* Filter Parameter (placeholder) */}
        <div className="flex flex-col items-center">
          <div className="text-black font-medium mb-2">filter</div>
          <div className="cursor-ns-resize flex flex-col items-center">
            <div className="text-gray-500">▼</div>
            <div className="text-black text-xl font-medium my-1">low</div>
            <div className="text-black text-xl font-medium my-1">100</div>
            <div className="text-gray-500">▼</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterOverlay;
