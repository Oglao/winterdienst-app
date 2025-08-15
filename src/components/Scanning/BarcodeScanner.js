import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Package, Camera, X, Check, Plus, Minus } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [materialInfo, setMaterialInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const html5QrcodeScannerRef = useRef(null);

  // Material-Datenbank (in echter App aus Backend)
  const materialDatabase = {
    '4012345678901': {
      name: 'Streusalz 25kg',
      type: 'Salz',
      unit: 'Sack',
      weight: 25,
      supplier: 'Salz GmbH'
    },
    '4012345678902': {
      name: 'Streusplit 25kg',
      type: 'Split',
      unit: 'Sack',
      weight: 25,
      supplier: 'Kies AG'
    },
    '4012345678903': {
      name: 'Frostschutzmittel 10L',
      type: 'Flüssigkeit',
      unit: 'Kanister',
      weight: 10,
      supplier: 'ChemCorp'
    },
    '4012345678904': {
      name: 'Schneeschaufel',
      type: 'Werkzeug',
      unit: 'Stück',
      weight: 2,
      supplier: 'Tool Inc'
    }
  };

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
        width: 280,
        height: 120
      },
      aspectRatio: 2.3,
      disableFlip: false,
      supportedScanTypes: [
        Html5QrcodeScanner.SCAN_TYPE_CAMERA,
        Html5QrcodeScanner.SCAN_TYPE_FILE
      ],
      formatsToSupport: [
        Html5QrcodeScanner.CODE_128,
        Html5QrcodeScanner.CODE_39,
        Html5QrcodeScanner.EAN_13,
        Html5QrcodeScanner.EAN_8
      ]
    };

    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      "barcode-reader",
      config,
      false
    );

    html5QrcodeScannerRef.current.render(
      (decodedText, decodedResult) => {
        console.log('Barcode gescannt:', decodedText);
        setScanResult(decodedText);
        lookupMaterial(decodedText);
        setIsScanning(false);
      },
      (error) => {
        console.warn('Barcode Scanner Error:', error);
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

  const lookupMaterial = (barcode) => {
    const material = materialDatabase[barcode];
    if (material) {
      setMaterialInfo(material);
    } else {
      setMaterialInfo({
        name: 'Unbekanntes Material',
        type: 'Unbekannt',
        unit: 'Stück',
        weight: 0,
        supplier: 'Unbekannt',
        barcode: barcode
      });
    }
  };

  const handleSave = () => {
    if (scanResult && onScan) {
      const materialData = {
        barcode: scanResult,
        material: materialInfo,
        quantity: quantity,
        notes: notes,
        timestamp: new Date().toISOString(),
        type: 'material_scan',
        totalWeight: materialInfo ? materialInfo.weight * quantity : 0
      };
      onScan(materialData);
    }
  };

  const adjustQuantity = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Material scannen</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 text-sm">
          Scannen Sie den Barcode von Salz, Split oder anderen Materialien
        </p>

        {/* Scanner Controls */}
        {!isScanning && !scanResult && (
          <div className="text-center">
            <button
              onClick={() => setIsScanning(true)}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 flex items-center space-x-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              <span>Barcode scannen</span>
            </button>
          </div>
        )}

        {/* Barcode Reader */}
        {isScanning && (
          <div className="mb-4">
            <div id="barcode-reader" className="w-full"></div>
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
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Barcode erkannt!</span>
              </div>
              <div className="text-sm text-green-700">
                <p><strong>Code:</strong> {scanResult}</p>
              </div>
            </div>

            {/* Material Info */}
            {materialInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Material-Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{materialInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Typ:</span>
                    <span>{materialInfo.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Einheit:</span>
                    <span>{materialInfo.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gewicht:</span>
                    <span>{materialInfo.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lieferant:</span>
                    <span>{materialInfo.supplier}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Menge</h3>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => adjustQuantity(-1)}
                  className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-2xl font-bold text-gray-900 min-w-12 text-center">
                  {quantity}
                </div>
                <button
                  onClick={() => adjustQuantity(1)}
                  className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center text-sm text-gray-600 mt-2">
                {materialInfo && `Gesamt: ${(materialInfo.weight * quantity).toFixed(1)} kg`}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notizen (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Zusätzliche Informationen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows="3"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                Material erfassen
              </button>
              <button
                onClick={() => {
                  setScanResult(null);
                  setMaterialInfo(null);
                  setQuantity(1);
                  setNotes('');
                }}
                className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
              >
                Neu
              </button>
            </div>
          </div>
        )}

        {/* Manual Input */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Oder Barcode manuell eingeben:</p>
          <input
            type="text"
            placeholder="Barcode eingeben..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                setScanResult(e.target.value.trim());
                lookupMaterial(e.target.value.trim());
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;