import React, { useMemo } from 'react';
import * as THREE from 'three';

const CarModel = ({ color = "#ff0000", team = "Ferrari" }) => {
  // Car structure:
  // 1. Chasis (Body)
  // 2. Nose (Front)
  // 3. Front Wing
  // 4. Rear Wing
  // 5. Wheels (4x)
  // 6. Halo

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color, 
    metalness: 0.8, 
    roughness: 0.2, 
    envMapIntensity: 1 
  }), [color]);

  const tireMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#111', 
    roughness: 0.8 
  }), []);

  const wingMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#000', 
    metalness: 0.5, 
    roughness: 0.5 
  }), []);

  return (
    <group scale={1.5}>
      {/* 1. Main Body */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.25, 2]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* 2. Nose Cone */}
      <mesh position={[0, 0.1, 1.2]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.3, 0.1, 1]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* 3. Front Wing */}
      <mesh position={[0, 0.05, 1.8]}>
        <boxGeometry args={[1.8, 0.05, 0.4]} />
        <primitive object={wingMaterial} attach="material" />
      </mesh>

      {/* 4. Rear Wing Planks */}
      <mesh position={[0, 0.5, -1]}>
        <boxGeometry args={[1.5, 0.05, 0.5]} />
        <primitive object={wingMaterial} attach="material" />
      </mesh>
      {/* Rear Wing Supports */}
      <mesh position={[0.6, 0.3, -1]}>
        <boxGeometry args={[0.05, 0.4, 0.4]} />
        <primitive object={wingMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.6, 0.3, -1]}>
        <boxGeometry args={[0.05, 0.4, 0.4]} />
        <primitive object={wingMaterial} attach="material" />
      </mesh>

      {/* 5. Wheels */}
      {/* Front Left */}
      <mesh position={[0.8, 0.15, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
        <primitive object={tireMaterial} attach="material" />
      </mesh>
      {/* Front Right */}
      <mesh position={[-0.8, 0.15, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
        <primitive object={tireMaterial} attach="material" />
      </mesh>
      {/* Rear Left */}
      <mesh position={[0.8, 0.15, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 16]} />
        <primitive object={tireMaterial} attach="material" />
      </mesh>
      {/* Rear Right */}
      <mesh position={[-0.8, 0.15, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 16]} />
        <primitive object={tireMaterial} attach="material" />
      </mesh>

      {/* 6. Airbox / Engine Cover */}
      <mesh position={[0, 0.4, -0.3]}>
        <boxGeometry args={[0.3, 0.3, 0.8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* 7. Halo Support */}
      <mesh position={[0, 0.35, 0.4]}>
        <torusGeometry args={[0.2, 0.05, 8, 16, Math.PI]} rotation={[Math.PI / 2, 0, 0]} />
        <primitive object={wingMaterial} attach="material" />
      </mesh>
    </group>
  );
};

export default CarModel;
