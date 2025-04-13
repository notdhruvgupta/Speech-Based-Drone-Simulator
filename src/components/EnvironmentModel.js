// src/components/EnvironmentModel.js
import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

function EnvironmentModel({ modelPath = '/models/environment.glb' }) { // Default path
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    // Optional: Set shadows for the environment model
    scene.traverse((child) => {
      if (child.isMesh) {
        // Environment typically receives shadows, doesn't cast them
        child.receiveShadow = true;
        // You might disable casting if the environment is huge to save performance
        // child.castShadow = false;
      }
    });
  }, [scene]);

  // Adjust scale, position, rotation as needed for your specific model
  return <primitive object={scene} scale={0.005} position={[10, -0.10, -30]} rotation={[0, 0, 0]} />;
}

// Preload for better performance (optional but recommended)
// Make sure the default path matches your file
useGLTF.preload('/models/environment.glb');

export default EnvironmentModel;