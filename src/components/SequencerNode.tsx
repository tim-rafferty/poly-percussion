import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrackData } from '@/types/sequencer';

interface SequencerNodeProps {
  track: TrackData;
  index: number;
  totalTracks: number;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, trackId: number, containerElement?: HTMLDivElement | null) => void;
  isTriggered: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const SequencerNode: React.FC<SequencerNodeProps> = ({
  track,
  index,
  totalTracks,
  onMouseDown,
  isTriggered,
  containerRef
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const outerNodeRef = useRef<HTMLDivElement>(null);
  const innerNodeRef = useRef<HTMLDivElement>(null);
  const lastPositions = useRef<{ x: number, opacity: number }[]>([]);
  const TRAIL_LENGTH = 18; // Increased from 12 to 18 for longer trails
  const TRAIL_SPACING = 4; // Pixels between trail elements
  
  // Use a more dynamic multiplier based on container width
  const getPositionMultiplier = () => {
    if (containerRef?.current) {
      return containerRef.current.clientWidth / 3;
    }
    return 160;
  };

  useEffect(() => {
    if (track.oscillating) {
      // Calculate current position in pixels
      const currentX = track.position * getPositionMultiplier();
      
      // Update trail positions with interpolation
      const newPositions = [];
      const baseOpacity = track.oscillating ? 0.8 : 0.3; // Increased from 0.6 to 0.8 for brighter trails
      
      // Create trail segments with smooth interpolation
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const prevPos = lastPositions.current[i] || { x: currentX, opacity: 0 };
        const targetX = i === 0 ? currentX : lastPositions.current[i - 1]?.x || currentX;
        
        // Interpolate position and opacity
        const interpolationFactor = 0.6; // Adjust for smoother or snappier trails
        const x = prevPos.x + (targetX - prevPos.x) * interpolationFactor;
        const opacity = baseOpacity * (1 - (i / TRAIL_LENGTH) * 0.8); // More gradual opacity falloff (0.8 multiplier)
        
        newPositions.push({ x, opacity });
      }
      
      lastPositions.current = newPositions;
    } else {
      lastPositions.current = [];
    }
  }, [track.position, track.oscillating]);

  // Generate pulsing rings
  const renderPulsingRings = () => {
    if (!track.oscillating) return null;
    
    return (
      <>
        {[1, 2, 3].map((ring) => (
          <div
            key={`ring-${ring}`}
            className="absolute top-1/2 left-1/2 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping-slow"
            style={{
              width: `${56 + ring * 20}px`,
              height: `${56 + ring * 20}px`,
              border: `2px solid ${track.color}`,
              opacity: 0.2,
              animationDelay: `${ring * 0.3}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </>
    );
  };

  // Generate particle effects
  const renderParticles = () => {
    if (!track.oscillating) return null;

    return (
      <>
        {[...Array(6)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute top-1/2 left-1/2 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-float"
            style={{
              width: '4px',
              height: '4px',
              backgroundColor: track.color,
              opacity: 0.6,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s',
              transform: `rotate(${i * 60}deg) translateY(-30px)`
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div 
      ref={nodeRef}
      className="absolute cursor-grab active:cursor-grabbing z-20"
      style={{
        left: '50%',
        top: `${(index + 0.5) * (100 / totalTracks)}%`,
        transform: `translate(calc(-50% + ${track.position * getPositionMultiplier()}px), -50%)`,
        willChange: 'transform',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        perspective: '1000px',
        backfaceVisibility: 'hidden'
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onMouseDown(e, track.id, containerRef?.current);
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          preventDefault: () => {},
          stopPropagation: () => {}
        } as React.MouseEvent<HTMLDivElement>;
        onMouseDown(mouseEvent, track.id, containerRef?.current);
      }}
    >
      {/* Pulsing rings */}
      {renderPulsingRings()}
      
      {/* Particle effects */}
      {renderParticles()}
      
      {/* Trail effect */}
      {track.oscillating && lastPositions.current.map((pos, i) => {
        const scale = 1 - (i / TRAIL_LENGTH) * 0.5; // Reduced from 0.6 to 0.5 for larger trail elements
        const width = Math.max(8, 16 * scale); // Increased from 6/14 to 8/16 for larger trails
        
        return (
          <div
            key={i}
            className="absolute top-1/2 rounded-full transform-gpu"
            style={{
              backgroundColor: track.color,
              opacity: pos.opacity,
              width: `${width}px`,
              height: `${width}px`,
              transform: `translate(${pos.x}px, -50%) scale(${scale})`,
              transition: 'all 50ms linear',
              pointerEvents: 'none',
              filter: `blur(${i * 0.4}px) brightness(1.2)`, // Reduced blur, added brightness
              zIndex: -i // Stack trails behind each other
            }}
          />
        );
      })}
      
      {/* Main node with enhanced animations */}
      <div 
        ref={outerNodeRef}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transform-gpu",
          track.oscillating ? "animate-pulse-slow" : ""
        )}
      >
        {/* Outer glow ring */}
        <div 
          className="absolute w-16 h-16 rounded-full transition-all duration-300"
          style={{ 
            background: `radial-gradient(circle, ${track.color}40 0%, transparent 70%)`,
            animation: track.oscillating ? 'pulse 2s ease-in-out infinite' : 'none',
            opacity: track.oscillating ? 0.8 : 0.4
          }}
        />
        
        {/* Main circle */}
        <div 
          className="w-14 h-14 rounded-full transition-all duration-300 transform-gpu"
          style={{ 
            backgroundColor: track.color,
            opacity: track.oscillating ? 0.8 : 0.4,
            boxShadow: Math.abs(track.position) < 0.1 
              ? `0 0 25px 8px ${track.color}, inset 0 0 15px rgba(255,255,255,0.5)` 
              : 'none',
            transition: 'all 0.2s ease-out'
          }}
        />
        
        {/* Inner node with enhanced effects */}
        <div 
          ref={innerNodeRef}
          className={cn(
            "absolute w-10 h-10 rounded-full sequencer-node-inner transform-gpu",
            track.oscillating ? "active" : ""
          )}
          style={{ 
            backgroundColor: track.color,
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: track.oscillating ? 'scale(1.05)' : 'scale(1)',
            boxShadow: Math.abs(track.position) < 0.1 
              ? `0 0 35px 10px ${track.color}, inset 0 0 20px rgba(255,255,255,0.6)` 
              : 'none',
            filter: track.oscillating ? 'brightness(1.2)' : 'none'
          }}
        />
      </div>
    </div>
  );
};

export default SequencerNode;
