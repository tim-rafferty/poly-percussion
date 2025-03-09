import React, { useCallback, useRef, useState } from 'react';
import { TrackData } from '@/hooks/useSequencer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useTone from '@/hooks/useTone';

interface ParameterControlsProps {
  track: TrackData;
  onUpdateParam: <K extends keyof TrackData>(param: K, value: TrackData[K]) => void;
}

interface DragState {
  startY: number;
  startValue: number;
  param: keyof TrackData;
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  track,
  onUpdateParam
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadSample } = useTone();

  const handleSampleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await loadSample(file);
      onUpdateParam('customSample', {
        enabled: true,
        buffer,
        name: file.name,
        originalPitch: 60 // Middle C by default
      });
    } catch (error) {
      console.error('Error loading sample:', error);
      // You might want to show a toast or error message here
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, param: keyof TrackData, currentValue: number, sensitivity: number, min: number, max: number, step: number = 1) => {
    e.preventDefault();
    setIsDragging(true);
    dragStateRef.current = {
      startY: e.clientY,
      startValue: currentValue,
      param
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      
      const deltaY = dragStateRef.current.startY - e.clientY;
      const valueChange = deltaY * sensitivity;
      const newValue = Math.round((dragStateRef.current.startValue + valueChange) / step) * step;
      const clampedValue = Math.min(max, Math.max(min, newValue));
      onUpdateParam(param, clampedValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStateRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onUpdateParam]);

  const renderDraggableValue = (label: string, param: keyof TrackData, value: number, sensitivity: number, min: number, max: number, step: number = 1, format: (val: number) => string = String) => (
    <div className="space-y-1">
      <div 
        className={cn(
          "block text-black text-xs font-medium cursor-ns-resize select-none bg-white/80 px-2 py-1 rounded",
          isDragging && dragStateRef.current?.param === param ? "bg-white" : ""
        )}
        onMouseDown={(e) => handleMouseDown(e, param, value, sensitivity, min, max, step)}
      >
        {label} {format(value)}
      </div>
    </div>
  );

  return (
    <div className="animate-slide-up glass-panel p-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Sample Selection Section */}
        <div className="space-y-1">
          <label className="block text-black text-xs font-medium bg-white/80 px-2 py-1 rounded">Sound</label>
          {track.customSample?.enabled ? (
            <div className="space-y-1">
              <div className="w-full p-1 bg-white/90 text-black rounded-md border border-black/20 text-xs truncate">
                {track.customSample.name}
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-6 text-xs bg-white hover:bg-white/90 text-black border border-black/20"
                >
                  Change
                </Button>
                <Button
                  onClick={() => onUpdateParam('customSample', null)}
                  className="h-6 text-xs bg-white hover:bg-white/90 text-black border border-black/20"
                >
                  ✕
                </Button>
              </div>
              {renderDraggableValue(
                "Sample Pitch",
                'customSample.originalPitch' as any,
                track.customSample.originalPitch,
                0.2,
                24,
                96,
                1,
                val => `${val} (MIDI)`
              )}
            </div>
          ) : (
            <>
              <select 
                value={track.sample}
                onChange={(e) => onUpdateParam('sample', e.target.value as TrackData['sample'])}
                className="w-full p-1 bg-white/90 text-black rounded-md border border-black/20 focus:outline-none focus:ring-1 focus:ring-black/20 text-xs"
              >
                <option value="kick">Kick</option>
                <option value="snare">Snare</option>
                <option value="hihat">Hi-hat</option>
                <option value="clap">Clap</option>
                <option value="tom">Tom</option>
                <option value="rim">Rim</option>
                <option value="cowbell">Cowbell</option>
                <option value="cymbal">Cymbal</option>
              </select>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-6 text-xs mt-1 bg-white hover:bg-white/90 text-black border border-black/20"
              >
                Upload Sample
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleSampleUpload}
          />
        </div>
        
        <div className="space-y-1">
          <label className="block text-black text-xs font-medium bg-white/80 px-2 py-1 rounded">Time</label>
          <select 
            value={track.timeSignature}
            onChange={(e) => onUpdateParam('timeSignature', Number(e.target.value))}
            className="w-full p-1 bg-white/90 text-black rounded-md border border-black/20 focus:outline-none focus:ring-1 focus:ring-black/20 text-xs"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16].map(num => (
              <option key={num} value={num}>{num}/16</option>
            ))}
          </select>
        </div>
        
        {renderDraggableValue("Volume", 'volume', track.volume, 0.2, -40, 0, 1, val => `${val} dB`)}
        {renderDraggableValue("Speed", 'speed', track.speed, 0.01, 0.5, 4, 0.1, val => `${val.toFixed(1)}x`)}
        {renderDraggableValue("Attack", 'attack', track.attack, 0.002, 0.01, 1, 0.01, val => `${val.toFixed(2)}s`)}
        {renderDraggableValue("Decay", 'decay', track.decay, 0.005, 0.1, 2, 0.1, val => `${val.toFixed(1)}s`)}
        {renderDraggableValue("Pitch", 'pitch', track.pitch, 0.1, -12, 12, 1, val => `${val > 0 ? '+' : ''}${val} st`)}
        
        {/* Delay Controls */}
        <div className="col-span-2 md:col-span-4 border-t border-black/20 mt-2 pt-2">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onUpdateParam('delayEnabled', !track.delayEnabled)}
              className={cn(
                "h-6 text-xs px-3",
                track.delayEnabled
                  ? "bg-blue-500/80 hover:bg-blue-600 text-white"
                  : "bg-white hover:bg-white/90 text-black border border-black/20"
              )}
            >
              {track.delayEnabled ? 'Delay On' : 'Delay Off'}
            </Button>
            
            <div className="flex-1 grid grid-cols-3 gap-2">
              {track.delayEnabled && (
                <>
                  {renderDraggableValue("Delay Time", 'delayTime', track.delayTime, 0.01, 0.1, 4.0, 0.1, val => {
                    const ms = val * 1000;
                    return ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${ms.toFixed(0)}ms`;
                  })}
                  {renderDraggableValue("D.Feedback", 'delayFeedback', track.delayFeedback, 0.01, 0, 0.9, 0.1, val => `${(val * 100).toFixed(0)}%`)}
                  {renderDraggableValue("D.Mix", 'delayMix', track.delayMix, 0.01, 0, 1, 0.1, val => `${(val * 100).toFixed(0)}%`)}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-1 items-center">
          <Button 
            onClick={() => onUpdateParam('muted', !track.muted)}
            className={cn(
              "flex-1 h-6 text-xs",
              track.muted 
                ? "bg-red-500/80 hover:bg-red-600 text-white" 
                : "bg-white hover:bg-white/90 text-black border border-black/20"
            )}
          >
            {track.muted ? 'Unmute' : 'Mute'}
          </Button>
          
          <Button 
            onClick={() => onUpdateParam('soloed', !track.soloed)}
            className={cn(
              "flex-1 h-6 text-xs",
              track.soloed 
                ? "bg-blue-500/80 hover:bg-blue-600 text-white" 
                : "bg-white hover:bg-white/90 text-black border border-black/20"
            )}
          >
            {track.soloed ? 'Unsolo' : 'Solo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParameterControls;
