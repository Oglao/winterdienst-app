import React from 'react';

const AbsoluteTest = () => {
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '50px' }}>🚨 KÖNNEN SIE DIESEN ROTEN TEXT SEHEN?</h1>
      
      <div style={{ 
        backgroundColor: 'yellow', 
        width: '500px', 
        height: '300px', 
        border: '10px solid black',
        margin: '20px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2 style={{ color: 'red', fontSize: '30px' }}>GELBE BOX MIT SCHWARZEM RAHMEN</h2>
      </div>
      
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
        Falls Sie die gelbe Box NICHT sehen, gibt es ein grundlegendes CSS-Problem!
      </p>
      
      <div style={{
        backgroundColor: 'red',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        margin: '20px',
        display: 'inline-block'
      }}>
      </div>
      
      <div style={{
        backgroundColor: 'green',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        margin: '20px',
        display: 'inline-block'
      }}>
      </div>
      
      <div style={{
        backgroundColor: 'blue',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        margin: '20px',
        display: 'inline-block'
      }}>
      </div>
      
      <p style={{ fontSize: '20px', color: 'purple' }}>
        Sie sollten 3 Kreise sehen: ROT, GRÜN, BLAU
      </p>
    </div>
  );
};

export default AbsoluteTest;