// src/components/CameraRig.js
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Camera offset from the drone (behind and slightly above)
const cameraOffset = new THREE.Vector3(0, 4, 10); // Adjust Y for height, Z for distance
const dampingFactor = 0.05; // Lower value = smoother/slower follow, Higher = tighter follow

// Temporary vectors to avoid creating new ones in the loop
const idealPosition = new THREE.Vector3();
const idealLookAt = new THREE.Vector3();
const currentPosition = new THREE.Vector3();
const currentLookAt = new THREE.Vector3();

function CameraRig({ targetRef }) { // Accepts a ref to the drone
  const { camera, controls } = useThree(); // Get camera and controls (if any)

  useFrame((state, delta) => {
    if (!targetRef.current) return; // Don't do anything if drone isn't loaded yet

    // --- Calculate Ideal Camera Position ---
    // 1. Get drone's world position
    targetRef.current.getWorldPosition(idealLookAt);

    // 2. Calculate the offset in world space based on drone's orientation
    idealPosition.copy(cameraOffset);
    idealPosition.applyQuaternion(targetRef.current.quaternion); // Apply drone's rotation to the offset
    idealPosition.add(idealLookAt); // Add the drone's position

    // --- Calculate Current Camera Position & LookAt ---
    // Use the controls' target if OrbitControls are active, otherwise use the drone's position
    const lookAtTarget = controls?.target || idealLookAt;
    currentPosition.copy(camera.position);
    currentLookAt.copy(lookAtTarget);

    // --- Smoothly Interpolate (Lerp) ---
    // Adjust damping based on delta to make it frame-rate independent (optional but good)
    const effectiveDamping = 1 - Math.exp(-dampingFactor * 60 * delta); // ~dampingFactor per frame at 60fps

    camera.position.lerp(idealPosition, effectiveDamping);

    // --- Smoothly Interpolate LookAt Target ---
    // Lerping the lookAt target makes the camera rotation smoother too
    const smoothedLookAt = new THREE.Vector3().lerpVectors(lookAtTarget, idealLookAt, effectiveDamping);
    camera.lookAt(smoothedLookAt);

    // If using OrbitControls, update its target to keep it centered on the drone
    // This allows manual panning/zooming *around* the drone while it follows
    if (controls) {
        controls.target.copy(smoothedLookAt);
        controls.update(); // Important: Update controls after modifying target/position
    }
  });

  return null; // This component doesn't render anything itself
}

export default CameraRig;