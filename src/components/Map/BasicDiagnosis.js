import React from 'react';

const BasicDiagnosis = () => {
  return (
    <div>
      {/* GRUNDLEGENDE HTML-TESTS */}
      <h1>🚨 BASIC DIAGNOSIS TEST</h1>
      
      <p>Wenn Sie diesen Text sehen können, funktioniert React grundsätzlich.</p>
      
      {/* TEST 1: EINFACHE FARBEN */}
      <div style={{ backgroundColor: 'red', color: 'white', padding: '20px', margin: '10px' }}>
        TEST 1: ROTE BOX - Können Sie das sehen?
      </div>
      
      <div style={{ backgroundColor: 'blue', color: 'white', padding: '20px', margin: '10px' }}>
        TEST 2: BLAUE BOX - Können Sie das sehen?
      </div>
      
      <div style={{ backgroundColor: 'green', color: 'white', padding: '20px', margin: '10px' }}>
        TEST 3: GRÜNE BOX - Können Sie das sehen?
      </div>
      
      {/* TEST 2: EINFACHER BUTTON OHNE STATE */}
      <button onClick={() => alert('Button funktioniert!')} style={{ 
        backgroundColor: 'orange', 
        color: 'white', 
        padding: '20px', 
        fontSize: '20px',
        margin: '10px',
        border: 'none',
        borderRadius: '5px'
      }}>
        TEST 4: KLICKEN SIE DIESEN BUTTON
      </button>
      
      {/* TEST 3: CONSOLE LOG BUTTON */}
      <button onClick={() => console.log('Console button clicked!')} style={{ 
        backgroundColor: 'purple', 
        color: 'white', 
        padding: '20px', 
        fontSize: '20px',
        margin: '10px',
        border: 'none',
        borderRadius: '5px'
      }}>
        TEST 5: CONSOLE LOG BUTTON
      </button>
      
      {/* TEST 4: EINFACHE KARTE */}
      <div style={{
        width: '600px',
        height: '300px',
        backgroundColor: 'lightblue',
        border: '5px solid black',
        margin: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        TEST 6: KARTEN-BEREICH - Können Sie diese hellblaue Box sehen?
      </div>
      
      {/* TEST 5: ABSOLUTE POSITIONING */}
      <div style={{
        width: '400px',
        height: '200px',
        backgroundColor: 'yellow',
        border: '3px solid red',
        margin: '20px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '100px',
          width: '50px',
          height: '50px',
          backgroundColor: 'black',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          🚛
        </div>
        <div style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          backgroundColor: 'red',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          🚛
        </div>
        <p style={{ margin: '10px', fontSize: '14px' }}>
          TEST 7: Können Sie 2 LKW-Symbole (🚛) in dieser gelben Box sehen?
        </p>
      </div>
      
      {/* TEST 6: JAVASCRIPT FUNKTIONIERT? */}
      <div style={{ backgroundColor: 'lightgray', padding: '20px', margin: '20px' }}>
        <h3>TEST 8: JAVASCRIPT TEST</h3>
        <p>Aktuelle Zeit: {new Date().toLocaleString()}</p>
        <p>Zufallszahl: {Math.random().toFixed(3)}</p>
        <p>Wenn Sie verschiedene Zahlen sehen, funktioniert JavaScript.</p>
      </div>
      
      {/* FRAGEN FÜR DEN USER */}
      <div style={{ backgroundColor: 'lightyellow', padding: '30px', margin: '20px', border: '3px solid orange' }}>
        <h2 style={{ color: 'red' }}>🚨 BITTE ANTWORTEN SIE:</h2>
        <ol style={{ fontSize: '18px', lineHeight: '1.8' }}>
          <li><strong>TEST 1-3:</strong> Können Sie die ROTE, BLAUE und GRÜNE Box sehen?</li>
          <li><strong>TEST 4:</strong> Wenn Sie den ORANGEN Button klicken, erscheint ein Alert?</li>
          <li><strong>TEST 5:</strong> Wenn Sie den LILA Button klicken, passiert etwas?</li>
          <li><strong>TEST 6:</strong> Können Sie die große HELLBLAUE Box mit schwarzem Rahmen sehen?</li>
          <li><strong>TEST 7:</strong> Können Sie 2 schwarze und rote 🚛 LKW-Symbole in der gelben Box sehen?</li>
          <li><strong>TEST 8:</strong> Sehen Sie eine aktuelle Zeit und eine Zufallszahl?</li>
          <li><strong>BROWSER:</strong> Welchen Browser verwenden Sie? (Chrome, Firefox, Safari, Edge?)</li>
          <li><strong>FEHLERMELDUNGEN:</strong> Drücken Sie F12, gehen Sie zu "Console" - sehen Sie rote Fehlermeldungen?</li>
        </ol>
      </div>
    </div>
  );
};

export default BasicDiagnosis;