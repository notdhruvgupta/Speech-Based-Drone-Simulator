// src/App.js
import React from 'react';
import DroneDemoPage from './components/DroneDemoPage';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Speech Controlled Drone Concept</h1>
      </header>
      <DroneDemoPage />
      <footer>
        <p>(Conceptual Demo - Drone movement simulated in browser)</p>
      </footer>
    </div>
  );
}

export default App;