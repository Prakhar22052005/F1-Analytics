import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import usePlaybackStore from '../store/usePlaybackStore';

const CameraController = () => {
  const { scene, camera } = useThree();
  const cameraMode = usePlaybackStore((state) => state.cameraMode);
  const followDriverId = usePlaybackStore((state) => state.followDriverId);
  const orbitRef = useRef();

  useFrame((state) => {
    if (cameraMode === 'follow' && followDriverId) {
      const car = scene.getObjectByName(followDriverId);
      if (car) {
        // 1. Calculate camera position behind the car
        // A offset of [0, 3, -10] puts the camera 3m up and 10m behind relative to the car's rotation
        const relativeCameraOffset = new THREE.Vector3(0, 5, -15);
        const cameraOffset = relativeCameraOffset.applyMatrix4(car.matrixWorld);
        
        state.camera.position.lerp(cameraOffset, 0.1);
        
        // 2. Look at a point slightly ahead of the car for cinematic feel
        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(car.quaternion);
        const lookTarget = car.position.clone().add(dir.multiplyScalar(10));
        state.camera.lookAt(lookTarget);
      }
    } else if (cameraMode === 'top') {
      state.camera.position.lerp(new THREE.Vector3(0, 1000, 0), 0.05);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={[200, 200, 200]} 
        fov={45} 
        far={20000} 
      />
      {cameraMode === 'free' && <OrbitControls ref={orbitRef} makeDefault dampingFactor={0.1} />}
    </>
  );
};

export default CameraController;



