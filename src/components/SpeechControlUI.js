// src/components/SpeechControlUI.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SpeechControlUI.css'; // Make sure this CSS file exists

// Check for browser support (run this check once)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechSupported = !!SpeechRecognition;

function SpeechControlUI({
  // Props from parent component (e.g., DroneDemoPage)
  isListening,          // Boolean state indicating if listening is intended
  setIsListening,       // Function to update the parent's isListening state
  onCommandRecognized,  // Callback function when a FINAL transcript is ready
  onListenStop,         // Callback function when listening fully stops (onend)
  transcript,           // The last FINAL transcript received from parent
  commandFeedback       // User-friendly string of the last command processed by parent
}) {
  const recognitionRef = useRef(null); // Ref to hold the SpeechRecognition instance
  const [errorMessage, setErrorMessage] = useState(''); // State for displaying errors
  const [interimTranscript, setInterimTranscript] = useState(''); // State for real-time speech feedback
  const [isSupportedState] = useState(isSpeechSupported); // Store support state locally
  const isStartingRef = useRef(false); // Ref to prevent rapid start calls

  // Effect to setup recognition instance and event handlers
  useEffect(() => {
    if (!isSupportedState) {
        console.warn("Speech recognition not supported in this browser.");
        return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      console.log("SpeechRecognition instance created.");
    }
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // --- Event Handlers ---

    recognition.onstart = () => {
      console.log(">>> EVENT: onstart - Recognition actually started");
      isStartingRef.current = false; // No longer in the starting phase
      setErrorMessage('');
      setInterimTranscript('');
      // Set state to true ONLY when the service confirms it has started
      if (!isListening) { // Check if state isn't already true
          console.log("onstart: Setting isListening state to true.");
          setIsListening(true);
      }
    };

    recognition.onresult = (event) => {
      // ... (onresult logic remains the same)
      let finalTranscriptChunk = '';
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptChunk += transcriptPart;
        } else {
          currentInterim += transcriptPart;
        }
      }
      setInterimTranscript(currentInterim);
      finalTranscriptChunk = finalTranscriptChunk.trim();
      if (finalTranscriptChunk) {
        console.log("Final Recognized Chunk:", finalTranscriptChunk);
        onCommandRecognized(finalTranscriptChunk);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.error(">>> EVENT: onerror - Speech recognition error:", event.error, event.message);
      isStartingRef.current = false; // Failed to start or errored during run
      let friendlyMessage = `Error: ${event.error}.`;
      // ... (error message generation remains the same)
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        friendlyMessage = "Microphone access denied. Please allow microphone access in your browser settings (click the padlock icon in the address bar). You might need to reload the page.";
      } else if (event.error === 'no-speech') {
        friendlyMessage = "No speech detected. Please ensure your microphone is working and speak clearly.";
      } else if (event.error === 'audio-capture') {
          friendlyMessage = "Microphone error. Ensure it's connected and not used by another application.";
      } else if (event.error === 'network') {
          friendlyMessage = "Network error. Speech recognition might require an internet connection.";
      }
      setErrorMessage(friendlyMessage);
      setInterimTranscript('');

      // Ensure listening state is false on error
      if (isListening) {
         console.log("onerror: Setting isListening state to false.");
         setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log(">>> EVENT: onend - Recognition service disconnected.");
      isStartingRef.current = false; // Definitely not starting anymore
      // This event fires after stop() is called, or on some errors/timeouts.
      // Ensure the state reflects that listening has stopped.
      if (isListening) {
           console.log("onend: Setting isListening state to false (syncing).");
           setIsListening(false);
      }
       setInterimTranscript('');
       onListenStop(); // Notify parent
    };

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        isStartingRef.current = false; // Reset ref on unmount
        recognitionRef.current.stop();
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        console.log("SpeechControlUI cleanup: Stopped recognition and detached handlers.");
      }
    };
  // Removed isListening from dependencies here - event handlers should not change based on it.
  // Let the state updates inside handlers use the latest state via setIsListening((prevState) => ...) if needed,
  // but direct reading of isListening inside handlers tied only to setup might be stale.
  // However, the current checks `if (isListening)` or `if (!isListening)` before calling setIsListening
  // are generally okay patterns. Let's keep setIsListening as dependency.
  // Adding isListening back as it *is* read in the handlers for conditional state setting.
  }, [isSupportedState, onCommandRecognized, onListenStop, setIsListening, isListening]);


  // --- Control Functions (Callbacks for Buttons) ---

  const startListening = useCallback(() => {
    console.log("Action: startListening called.");
    // Prevent starting if not supported, already listening, OR if we are currently trying to start
    if (!isSupportedState || isListening || isStartingRef.current) {
        console.log(`Skipping start: Supported=${isSupportedState}, Listening=${isListening}, Starting=${isStartingRef.current}`);
        return;
    }

    setErrorMessage('');
    setInterimTranscript('');

    try {
      // Set a flag indicating we are attempting to start
      isStartingRef.current = true;
      console.log("Calling recognition.start()...");
      recognitionRef.current.start();
      // --- REMOVED OPTIMISTIC UPDATE ---
      // We now wait for the 'onstart' event to set isListening = true
      // This makes the UI slightly less responsive *to starting* but prevents the race condition.
      console.log("Action: Recognition requested to start. Waiting for onstart event.");

    } catch (error) {
      isStartingRef.current = false; // Reset flag on synchronous error
      console.error("Synchronous error calling recognition.start():", error);
      setErrorMessage(`Failed to start listening: ${error.message}`);
      // Ensure state is false if the synchronous start fails
      if (isListening) { // Should not happen if logic is correct, but as safeguard
          setIsListening(false);
      }
    }
  // Add isStartingRef.current to dependencies? No, useCallback should capture the ref itself.
  }, [isSupportedState, isListening, setIsListening]); // Dependencies


  const stopListening = useCallback(() => {
    console.log("Action: stopListening called.");
    // Prevent stopping if not currently listening or if ref is somehow lost
    // Also check isStartingRef - if we are *trying* to start but haven't succeeded yet,
    // stopListening shouldn't really do anything except maybe reset the flag.
    // However, the primary guard is !isListening. If isListening is false, we shouldn't stop.
    if (!isListening || !recognitionRef.current) {
        console.log(`Skipping stop: Listening=${isListening}, Ref Exists=${!!recognitionRef.current}`);
        return;
    }

    try {
      console.log("Calling recognition.stop()...");
      recognitionRef.current.stop(); // Request the API to stop
      // Keep optimistic update for stopping for better UI feedback.
      // The onend event will confirm later.
      setIsListening(false);
      console.log("Action: Set isListening state to false (optimistic).");

    } catch (error) {
      // Catch synchronous errors during the .stop() call (less common)
      console.error("Synchronous error calling recognition.stop():", error);
      setErrorMessage(`Error stopping listening: ${error.message}`);
       // Ensure state is false even if sync stop fails
       if (isListening) { // Should already be false due to optimistic update, but safeguard
           setIsListening(false);
       }
    }
     // Reset the starting flag if stop is called explicitly
    isStartingRef.current = false;

  }, [isListening, setIsListening]); // Dependencies

  // --- Render Logic ---
  // ... (Render logic remains the same)
  return (
    <div className="speech-controls">
      {/* Display message if browser doesn't support the API */}
      {!isSupportedState && (
        <p className="error-message support-error">
          ⚠️ Speech recognition is not supported by your browser. Please try Chrome or Edge.
        </p>
      )}

      {/* Show button only if supported */}
      {isSupportedState && (
        <button
          onClick={isListening ? stopListening : startListening}
          className={`control-button ${isListening ? 'listening' : 'idle'} ${isStartingRef.current ? 'starting' : ''}`} // Optional: Add class for visual feedback during start attempt
          // Disable button briefly while trying to start? Or rely on isListening state update.
          // Adding disabled={isStartingRef.current} might be too aggressive if start is fast.
          // Relying on the guard clauses inside the handlers is generally better.
          disabled={!isSupportedState}
        >
          {/* Change button text and icon based on listening state */}
          {isListening ? (
            <>
              <span className="listening-icon"></span> Stop Listening
            </>
          ) : (
            '🎤 Start Listening'
          )}
        </button>
      )}

      {/* Area for displaying feedback (errors, transcripts) */}
      <div className="feedback-area">
         {/* Show error message if one exists */}
         {errorMessage && <p className="error-message">{errorMessage}</p>}

        {/* Display for real-time speech recognition */}
        <div className="transcript-display">
          <span className="transcript-label">Recognizing:</span>
          <span className="interim-transcript">{interimTranscript}</span>
          {/* Show ellipsis if listening but nothing heard yet */}
          {/* Adjusted condition slightly: show if intending to listen (or actually listening) and no text yet */}
          {(isListening || isStartingRef.current) && !interimTranscript && !transcript && <span className="waiting-indicator">...</span>}
        </div>

        {/* Display the last fully processed command and its raw transcript */}
         <p className="final-transcript-display">
             <strong>Last Command:</strong> {commandFeedback || 'None'}
             <br/>
             <small><em>(Raw: {transcript || '...'})</em></small>
         </p>
      </div>

       {/* Instructions for the user */}
       <div className="instructions">
            <p><strong>Example Commands:</strong></p>
            <ul>
                <li>"Take off" / "Land"</li>
                <li>"Go forward" / "Backward"</li>
                <li>"Turn left" / "Turn right"</li>
                <li>"Go up" / "Go down"</li>
                <li>"Stop" / "Hold position"</li>
            </ul>
       </div>
    </div>
  );
}

export default SpeechControlUI;