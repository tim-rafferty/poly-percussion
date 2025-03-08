
import React from 'react';
import { TrackData } from '@/hooks/useSequencer';
import { X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

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

  // Handle sample change
  const handleSampleChange = (direction: 'next' | 'prev') => {
    const currentIndex = sampleOptions.indexOf(track.sample);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % sampleOptions.length;
    } else {
      newIndex = currentIndex - 1 < 0 ? sampleOptions.length - 1 : currentIndex - 1;
    }
    
    onUpdateParam('sample', sampleOptions[newIndex] as any);
  };

  // Handle filter change
  const handleFilterChange = (direction: 'next' | 'prev') => {
    const currentIndex = filterOptions.indexOf('low'); // Currently hardcoded to low
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filterOptions.length;
    } else {
      newIndex = currentIndex - 1 < 0 ? filterOptions.length - 1 : currentIndex - 1;
    }
    
    // This is a placeholder since 'filter' is not part of TrackData
    console.log(`Filter changed to ${filterOptions[newIndex]}`);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {/* Sound Parameter */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Sound</div>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSampleChange('prev')}
              className="h-8 w-8 p-0"
            >
              ◀
            </Button>
            <div className="text-black font-medium mx-2">{track.sample}</div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSampleChange('next')}
              className="h-8 w-8 p-0"
            >
              ▶
            </Button>
          </div>
        </div>
        
        {/* Time Parameter */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Time ({track.timeSignature}/16)</div>
          <Slider
            value={[track.timeSignature]}
            min={1}
            max={16}
            step={1}
            onValueChange={(value) => onUpdateParam('timeSignature', value[0])}
            className="my-2"
          />
        </div>
        
        {/* Speed Parameter */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Speed ({(track.speed * 100).toFixed(0)})</div>
          <Slider
            value={[track.speed]}
            min={0.5}
            max={4}
            step={0.1}
            onValueChange={(value) => onUpdateParam('speed', value[0])}
            className="my-2"
          />
        </div>
        
        {/* Attack Parameter */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Attack ({(track.attack * 100).toFixed(0)})</div>
          <Slider
            value={[track.attack]}
            min={0.01}
            max={1}
            step={0.01}
            onValueChange={(value) => onUpdateParam('attack', value[0])}
            className="my-2"
          />
        </div>
        
        {/* Decay Parameter */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Decay ({(track.decay * 100).toFixed(0)})</div>
          <Slider
            value={[track.decay]}
            min={0.1}
            max={2}
            step={0.1}
            onValueChange={(value) => onUpdateParam('decay', value[0])}
            className="my-2"
          />
        </div>
        
        {/* Volume Parameter */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Volume ({Math.abs(track.volume).toFixed(0)})</div>
          <Slider
            value={[track.volume]}
            min={-40}
            max={0}
            step={1}
            onValueChange={(value) => onUpdateParam('volume', value[0])}
            className="my-2"
          />
        </div>
        
        {/* Filter Parameter (placeholder) */}
        <div className="flex flex-col">
          <div className="text-black font-medium mb-2">Filter</div>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleFilterChange('prev')}
              className="h-8 w-8 p-0"
            >
              ◀
            </Button>
            <div className="text-black font-medium mx-2">low</div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleFilterChange('next')}
              className="h-8 w-8 p-0"
            >
              ▶
            </Button>
          </div>
          <Slider
            value={[100]}
            min={0}
            max={200}
            step={1}
            onValueChange={(value) => console.log('Filter value:', value[0])}
            className="my-2"
          />
        </div>
      </div>
    </div>
  );
};

export default ParameterOverlay;
