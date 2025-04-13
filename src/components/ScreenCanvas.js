// src/components/SceneCanvas.js
import React, { Suspense, useRef } from 'react'; // Import useRef
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stats } from '@react-three/drei'; // Keep OrbitControls for optional use
import DroneModel from './DroneModel';
// import Environment from './Environment'; // Remove old environment
import EnvironmentModel from './EnvironmentModel'; // Import new environment
import CameraRig from './CameraRig'; // Import camera rig

function SceneCanvas({ command }) {
  const droneRef = useRef(); // Create a ref for the drone
  console.log(`SceneCanvas received command prop: "${command}"`); // Verify prop reception


  return (
    // Adjust initial camera position/fov if needed, CameraRig will take over
    <Canvas camera={{ position: [0, 10, 25], fov: 50 }} shadows>
      {/* Performance Stats */}
      <Stats />

      {/* Basic Lighting - Keep these unless your environment model has good built-in lights */}
      <ambientLight intensity={0.5} /> {/* Adjust intensity as needed */}
      <directionalLight
        castShadow
        position={[50, 80, 50]} // Adjust position/angle for environment
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-100} // Adjust shadow camera bounds for environment size
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      {/* Nice sky background */}
      <Sky sunPosition={[100, 20, 100]} />

      {/* Load Models within Suspense */}
      <Suspense fallback={null}>
        {/* Render the Environment */}
        <EnvironmentModel modelPath="/models/environment.glb" /> {/* Pass your model path */}

        {/* Render the Drone, passing the ref */}
        <DroneModel ref={droneRef} command={command} />
      </Suspense>

      {/* Add the Camera Rig and pass the drone's ref */}
      <CameraRig targetRef={droneRef} />

      {/* Keep OrbitControls for debugging - it will work WITH the CameraRig */}
      {/* You can manually override the camera while OrbitControls are active */}
      {/* Comment out if you ONLY want the follow camera */}
      <OrbitControls makeDefault />

    </Canvas>
  );
}

export default SceneCanvas;