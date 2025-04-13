// src/components/Environment.js
import React from 'react';

function Environment() {
  return (
    <>
      {/* Basic Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        castShadow // Enable shadow casting
        position={[50, 50, 25]}
        intensity={1.5}
        shadow-mapSize-width={2048} // Higher res shadows
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      {/* Simple Ground Plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </>
  );
}

export default Environment;