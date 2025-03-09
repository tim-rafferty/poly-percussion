import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import React, { useRef } from 'react'
import * as THREE from 'three'

interface VisualizerProps {
  analyzerData: Float32Array | undefined;
}

function VisualizerMesh({ analyzerData }: VisualizerProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame(() => {
    if (meshRef.current && analyzerData) {
      // Get average volume
      const average = analyzerData.reduce((sum, value) => sum + Math.abs(value), 0) / analyzerData.length;
      
      // Scale the mesh based on volume
      const scale = 1 + average * 2;
      meshRef.current.scale.set(scale, scale, scale);
      
      // Change color based on volume
      if (materialRef.current) {
        materialRef.current.color.setHSL(average * 2, 0.8, 0.5);
      }
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 100, 16]} />
      <meshStandardMaterial ref={materialRef} />
    </mesh>
  )
}

export default function AudioVisualizer({ analyzerData }: VisualizerProps) {
  return (
    <div className="w-full h-[400px] bg-black/20 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <VisualizerMesh analyzerData={analyzerData} />
        <OrbitControls />
      </Canvas>
    </div>
  )
} 