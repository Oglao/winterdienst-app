import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, X, Check } from 'lucide-react';

const QRCodeScanner = ({ onScan, onClose, type = 'route' }) => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (isScanning) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isScanning]);

  const startScanner = () => {
    if (html5QrcodeScannerRef.current) return;

    const config = {
      fps: 10,
      qrbox: {
        width: 250,
        height: 250
      },
      aspectRatio: 1.0,
      disableFlip: false,
      supportedScanTypes: [
        Html5QrcodeScanner.SCAN_TYPE_CAMERA,
        Html5QrcodeScanner.SCAN_TYPE_FILE
      ]
    };

    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );

    html5QrcodeScannerRef.current.render(
      (decodedText, decodedResult) => {
        console.log('QR Code gescannt:', decodedText);
        setScanResult(decodedText);
        handleScanSuccess(decodedText);
      },
      (error) => {
        console.warn('QR Scanner Error:', error);
      }
    );
  };

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().then(() => {
        html5QrcodeScannerRef.current = null;
      }).catch(err => {
        console.error('Error stopping scanner:', err);
        html5QrcodeScannerRef.current = null;
      });
    }
  };

  const handleScanSuccess = (result) => {
    setIsScanning(false);
    
    // Parse QR Code data based on type
    let parsedData = null;
    try {
      parsedData = JSON.parse(result);
    } catch (e) {
      // If not JSON, treat as simple string
      parsedData = { id: result, raw: result };
    }

    // Add type information
    parsedData.scannedType = type;
    parsedData.timestamp = new Date().toISOString();

    if (onScan) {
      onScan(parsedData);
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'route': return 'Route QR-Code scannen';
      case 'vehicle': return 'Fahrzeug QR-Code scannen';
      case 'material': return 'Material Barcode scannen';
      default: return 'QR-Code scannen';
    }
  };

  const getDescription = () => {
    switch(type) {
      case 'route': return 'Scannen Sie den QR-Code einer Route um sie zu starten';
      case 'vehicle': return 'Scannen Sie den QR-Code am Fahrzeug für Check-in';
      case 'material': return 'Scannen Sie den Barcode von Salz oder Streumaterial';
      default: return 'Richten Sie die Kamera auf den Code';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 text-sm">{getDescription()}</p>

        {/* Scanner Area */}
        {!isScanning && !scanResult && (
          <div className="text-center">
            <button
              onClick={() => setIsScanning(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              <span>Scanner starten</span>
            </button>
          </div>
        )}

        {/* QR Reader */}
        {isScanning && (
          <div className="mb-4">
            <div id="qr-reader" className="w-full"></div>
            <div className="mt-2 text-center">
              <button
                onClick={() => setIsScanning(false)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Scanner stoppen
              </button>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-green-800 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Erfolgreich gescannt!</span>
            </div>
            <div className="text-sm text-green-700">
              <p><strong>Ergebnis:</strong> {scanResult}</p>
              <p><strong>Typ:</strong> {type}</p>
            </div>
          </div>
        )}

        {/* Manual Input */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Oder manuell eingeben:</p>
          <input
            type="text"
            placeholder={`${type} ID eingeben...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                handleScanSuccess(e.target.value.trim());
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;