import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Billboard } from '@react-three/drei';
import usePlaybackStore from '../store/usePlaybackStore';
import CarModel from './CarModel';

const Car = ({ driverId, color, telemetry = [] }) => {
  const meshRef = useRef();
  const targetPos = useRef(new THREE.Vector3());
  const currentTime = usePlaybackStore((state) => state.currentTime);
  
  const currentData = useMemo(() => {
    if (telemetry.length === 0) return null;
    return telemetry.find(d => d.session_time >= currentTime) || telemetry[telemetry.length - 1];
  }, [telemetry, currentTime]);

  useFrame(() => {
    if (!meshRef.current || !currentData) return;

    const off = window.TRACK_OFFSET || { x: 0, y: 0, z: 0, scale: 0.001 };
    
    targetPos.current.set(
      (currentData.x - off.x) * off.scale, 
      (currentData.z - off.z) * off.scale + 0.1, 
      -(currentData.y - off.y) * off.scale
    );

    meshRef.current.position.lerp(targetPos.current, 0.1);
    
    const lookAtTarget = targetPos.current.clone().add(new THREE.Vector3(0, 0, 0.5));
    meshRef.current.lookAt(lookAtTarget);
  });

  return (
    <group ref={meshRef} name={driverId}>
      <CarModel color={color} team={driverId} />

      {/* Billboard ensures label is never mirrored and always readable */}
      <Billboard position={[0, 4, 0]}>
        <Text
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000"
        >
          {driverId}
        </Text>
      </Billboard>

      {/* Visual Telemetry: Brake/Throttle Lights */}
      {currentData?.throttle > 80 && (
        <pointLight position={[0, 2, -2]} color="#00ff00" intensity={30} distance={20} />
      )}
      {currentData?.brake > 10 && (
        <pointLight position={[0, 2, -2]} color="#ff0000" intensity={40} distance={20} />
      )}
    </group>
  );
};

export default Car;


