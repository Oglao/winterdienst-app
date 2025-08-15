import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import SimpleApp from './App.simple';
import MinimalApp from './App.minimal';
import reportWebVitals from './reportWebVitals';
// Initialize console protection for GPS errors
import { initConsoleProtection } from './utils/consoleProtection';
initConsoleProtection();

// Choose app version based on URL parameter
let AppToRender = App;
if (window.location.search.includes('minimal=true')) {
  AppToRender = MinimalApp;
} else if (window.location.search.includes('simple=true')) {
  AppToRender = SimpleApp;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppToRender />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
