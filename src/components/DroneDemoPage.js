// src/components/DroneDemoPage.js
import React, { useState, useCallback } from 'react';
import SpeechControlUI from './SpeechControlUI';
import SceneCanvas from './ScreenCanvas';
// import SpeechControlUI from './SpeechControlUI';
// import SceneCanvas from './SceneCanvas';
import './DroneDemoPage.css'; // For layout

function DroneDemoPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentCommand, setCurrentCommand] = useState('stop'); // Initial state
  const [commandFeedback, setCommandFeedback] = useState('None');

  // Function to parse transcript and set command
  const handleCommandRecognition = useCallback((recognizedTranscript) => {
    
    setTranscript(recognizedTranscript); // Show raw transcript
    const lowerTranscript = recognizedTranscript.toLowerCase();
    let command = 'stop'; // Default to stop if no keyword found
    
    // Simple keyword spotting
    if (lowerTranscript.includes('forward')) command = 'forward';
    else if (lowerTranscript.includes('back') || lowerTranscript.includes('backward')) command = 'backward';
    else if (lowerTranscript.includes('left')) command = 'left'; // Could be turn or strafe
    else if (lowerTranscript.includes('right')) command = 'right'; // Could be turn or strafe
    else if (lowerTranscript.includes('up')) command = 'up';
    else if (lowerTranscript.includes('down')) command = 'down';
    else if (lowerTranscript.includes('stop') || lowerTranscript.includes('hold') || lowerTranscript.includes('stay')) command = 'stop';
    else if (lowerTranscript.includes('land')) command = 'land'; // Add specific commands
    else if (lowerTranscript.includes('take off')) command = 'takeoff'; // Add specific commands
    
    console.log(`Transcript: "${lowerTranscript}", Parsed Command: "${command}"`); // Verify parsing
    // Update state only if the command changes to avoid unnecessary re-renders
    setCurrentCommand(prevCommand => {
        if (prevCommand !== command) {
          console.log(`Updating command state from "${prevCommand}" to "${command}"`); // Verify state update trigger
            setCommandFeedback(command.charAt(0).toUpperCase() + command.slice(1)); // Nicer display
            return command;
        }
        return prevCommand;
    });

    // Optional: Automatically stop listening after a command if continuous is false
    // setIsListening(false);

  }, []); // Empty dependency array means this function is created once


  // Reset command to 'stop' when listening stops, unless the last command was land/takeoff etc.
  const handleListenStop = useCallback(() => {
      setIsListening(false);
      // Maybe you want the drone to continue its last command until explicitly stopped?
      // Or maybe reset to 'stop' when listening stops? This depends on desired behaviour.
      // Example: Reset to stop if it was moving.
      // if (['forward', 'backward', 'left', 'right', 'up', 'down'].includes(currentCommand)) {
      //    setCurrentCommand('stop');
      //    setCommandFeedback('Stop');
      // }
  }, [/* currentCommand */]); // Add dependencies if logic uses them

  return (
    <div className="drone-demo-container">
      <div className="controls-panel">
        <SpeechControlUI
          isListening={isListening}
          setIsListening={setIsListening}
          onCommandRecognized={handleCommandRecognition}
          onListenStop={handleListenStop} // Pass down stop handler
          transcript={transcript}
          commandFeedback={commandFeedback}
        />
      </div>
      <div className="scene-panel">
        <SceneCanvas command={currentCommand} />
      </div>
    </div>
  );
}

export default DroneDemoPage;