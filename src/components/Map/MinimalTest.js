import React from 'react';

const MinimalTest = () => {
  return (
    <div>
      <h1>🚨 MINIMAL TEST - SEHEN SIE DIESEN TEXT?</h1>
      
      <div style={{ backgroundColor: 'red', width: '500px', height: '300px' }}>
        <p style={{ color: 'white', padding: '20px' }}>ROTE BOX - SICHTBAR?</p>
      </div>
      
      <div style={{ backgroundColor: 'blue', width: '100px', height: '100px', borderRadius: '50%' }}>
        <span style={{ color: 'white' }}>BLAU</span>
      </div>
      
      <div style={{ backgroundColor: 'green', width: '100px', height: '100px' }}>
        <span style={{ color: 'white' }}>GRÜN</span>
      </div>
      
      <p>Falls Sie diese farbigen Boxen NICHT sehen, ist CSS komplett kaputt!</p>
    </div>
  );
};

export default MinimalTest;