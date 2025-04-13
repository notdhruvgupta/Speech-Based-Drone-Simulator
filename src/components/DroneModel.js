// src/components/DroneModel.js
import React, { useRef, useEffect, useState, forwardRef } from "react"; // Import forwardRef
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ... (Constants remain the same) ...
// Constants for movement
const MOVE_SPEED = 6.0; // units per second
const ROTATION_SPEED = Math.PI / 5; // radians per second
const ALTITUDE_SPEED = 7.0; // units per second
const TAKEOFF_ALTITUDE = 25.0;
const LANDING_SPEED = 10.0;

// Wrap component definition with forwardRef
const DroneModel = forwardRef(({ command }, ref) => {
  // Receive ref as the second argument
  // const droneRef = useRef(); // Don't create a local ref here, use the forwarded one
  const { scene } = useGLTF("/models/drone.glb");
  const [status, setStatus] = useState("grounded");
  const targetAltitude = useRef(0);
  console.log(
    `DroneModel received command prop: "${command}", Current Status: "${status}"`
  ); // Verify prop and status

  // --- Model Setup Effect ---
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Set initial position using the passed ref
    if (ref?.current) {
      ref.current.position.y = 1;
    }
  }, [scene, ref]); // Add ref to dependency array

  // --- Command Handling Effect ---
  useEffect(() => {
    if (!ref?.current) return;
    console.log(
      `Drone Command Effect: command="${command}", status="${status}"`
    ); // Log entry

    switch (command) {
      case "takeoff":
        if (status === "grounded") {
          setStatus("takingOff");
          targetAltitude.current = TAKEOFF_ALTITUDE;
          console.log("Drone Command Effect: Setting status to 'takingOff'"); // Log state change
        } else {
          console.log(
            "Drone Command Effect: Ignoring 'takeoff' (not grounded)"
          );
        }
        break;
      case "land":
        if (status === "flying" || status === "takingOff") {
          setStatus("landing");
          targetAltitude.current = 0.1; // Landing target
          console.log("Drone Command Effect: Setting status to 'landing'"); // Log state change
        } else {
          console.log(
            "Drone Command Effect: Ignoring 'land' (not flying/taking off)"
          );
        }
        break;
      // ... other cases if needed, maybe log ignored commands
      default:
        if (status === "grounded" && command !== "stop") {
          console.log(
            `Drone Command Effect: Ignoring command "${command}" while grounded.`
          );
        }
        break;
    }
  }, [command, status, ref]); // Add ref to dependency array

  // --- Animation Loop ---
  useFrame((state, delta) => {
    if (!ref?.current) return; // Use the passed ref

    const drone = ref.current; // Use the forwarded ref for clarity
    const currentPosition = drone.position;
    const currentY = currentPosition.y;

    // --- Handle Vertical State Machine ---
    if (status === "takingOff") {
      if (currentY < targetAltitude.current) {
        drone.position.y += ALTITUDE_SPEED * delta;
      } else {
        drone.position.y = targetAltitude.current;
        setStatus("flying");
        console.log("Drone Status: Flying");
      }
      return;
    }
    if (status === "landing") {
      if (currentY > targetAltitude.current) {
        drone.position.y -= LANDING_SPEED * delta;
      } else {
        drone.position.y = targetAltitude.current;
        setStatus("grounded");
        console.log("Drone Status: Grounded");
      }
      return;
    }

    // --- Handle Movement Commands (only if flying) ---
    if (status === "flying") {
      switch (command) {
        case "forward":
          drone.translateZ(-MOVE_SPEED * delta);
          break;
        case "backward":
          drone.translateZ(MOVE_SPEED * delta);
          break;
        case "left":
          drone.rotateY(ROTATION_SPEED * delta);
          break;
        case "right":
          drone.rotateY(-ROTATION_SPEED * delta);
          break;
        case "up":
          drone.position.y += ALTITUDE_SPEED * delta;
          // Add max altitude if needed:
          // if (drone.position.y > MAX_ALTITUDE) drone.position.y = MAX_ALTITUDE;
          break;
        case "down":
          drone.position.y -= ALTITUDE_SPEED * delta;
          if (drone.position.y < 0.5) {
            drone.position.y = 0.5;
          }
          break;
        case "stop":
          break;
      }
    }
    // --- Bounds checking (Optional) ---
    // drone.position.x = THREE.MathUtils.clamp(drone.position.x, -45, 45);
    // drone.position.z = THREE.MathUtils.clamp(drone.position.z, -45, 45);
  });

  // Pass the forwarded ref to the primitive element
  return <primitive ref={ref} object={scene} scale={5} />;
}); // Close forwardRef

useGLTF.preload("/models/drone.glb");

export default DroneModel; // Export the wrapped component
