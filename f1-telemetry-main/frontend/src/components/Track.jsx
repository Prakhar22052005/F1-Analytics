import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import usePlaybackStore from '../store/usePlaybackStore';

const Track = ({ raceId }) => {
  const [points, setPoints] = useState([]);
  const [curbTexture, setCurbTexture] = useState(null);

  // 1. Procedural Fallback Generator (Monaco-inspired for guaranteed visibility)
  const generateFallbackPoints = () => {
    const pts = [];
    const segments = 100;
    const radius = 800; // 800 meters
    for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        // Add some noise for "Monaco" look
        const r = radius + 200 * Math.sin(theta * 3) + 100 * Math.cos(theta * 5);
        pts.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
    }
    return pts;
  };

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/checker.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(500, 1);
      setCurbTexture(tex);
    });
  }, []);

  useEffect(() => {
    if (!raceId) return;
    
    fetch(`http://localhost:3001/api/telemetry/${raceId}/track`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          console.warn("[Track] Backend empty. Using Procedural Monaco Fallback.");
          setPoints(generateFallbackPoints());
          window.TRACK_OFFSET = { x: 0, y: 0, z: 0, scale: 1 };
          return;
        }
        
        const avgX = data.reduce((sum, p) => sum + p.x, 0) / data.length;
        const avgY = data.reduce((sum, p) => sum + p.y, 0) / data.length;
        const avgZ = data.reduce((sum, p) => sum + p.z, 0) / data.length;
        
        const scale = 0.001; 
        const pts = data.map(p => new THREE.Vector3(
          (p.x - avgX) * scale, 
          0, 
          -(p.y - avgY) * scale
        ));
        
        setPoints(pts);
        window.TRACK_OFFSET = { x: avgX, y: avgY, z: avgZ, scale: scale };
      })
      .catch(() => {
        setPoints(generateFallbackPoints());
        window.TRACK_OFFSET = { x: 0, y: 0, z: 0, scale: 1 };
      });
  }, [raceId]);

  const curve = useMemo(() => {
    if (points.length === 0) return null;
    return new THREE.CatmullRomCurve3(points, true);
  }, [points]);

  if (!curve) return null;

  return (
    <group>
      {/* Dynamic Environment Lighting */}
      <hemisphereLight intensity={0.4} groundColor="#112" color="#fff" />
      <directionalLight position={[1000, 2000, 1000]} intensity={3} castShadow />
      
      {/* 1. Main Asphalt Track */}
      <mesh receiveShadow>
        <tubeGeometry args={[curve, 1024, 18, 12, true]} />
        <meshStandardMaterial 
          color="#0a0a0c" 
          roughness={0.6} 
          metalness={0.9}
        />
      </mesh>

      {/* 2. Glowing Neon Border (Broadcast aesthetics) */}
      <mesh position={[0, 0.1, 0]}>
        <tubeGeometry args={[curve, 512, 19, 8, true]} />
        <meshBasicMaterial color="#00f3ff" wireframe />
      </mesh>

      {/* 3. Curbs */}
      <mesh position={[0, 0.2, 0]}>
        <tubeGeometry args={[curve, 1024, 18.5, 8, true]} />
        <meshStandardMaterial 
          map={curbTexture}
          color={curbTexture ? "white" : "#cc0000"}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 4. Large Dark Environment Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>

      <gridHelper args={[10000, 100, "#222", "#111"]} position={[0, -4.9, 0]} />
    </group>
  );
};

export default Track;





