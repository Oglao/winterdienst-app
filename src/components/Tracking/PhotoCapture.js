import React, { useState, useRef, useCallback } from 'react';
import { Camera, Image, MapPin, Clock, Upload, X } from 'lucide-react';
import { logGPSError } from '../../utils/gpsErrorHandler';

const PhotoCapture = ({ photos, onPhotoCapture, currentLocation }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState(photos || []);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // GPS-Position ermitteln
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (currentLocation) {
        resolve(currentLocation);
        return;
      }
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            const errorInfo = logGPSError(error, 'PhotoCapture');
            console.warn('GPS-Position nicht verfügbar:', errorInfo.userFriendlyMessage);
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        resolve(null);
      }
    });
  }, [currentLocation]);

  // Kamera starten
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Rückkamera bevorzugen
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Kamera-Zugriff fehlgeschlagen:', error);
      alert('Kamera-Zugriff fehlgeschlagen. Bitte verwenden Sie die Datei-Upload Option.');
      setShowCamera(false);
    }
  };

  // Kamera stoppen
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Foto aufnehmen
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const location = await getCurrentLocation();
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    // Foto mit Metadaten erstellen
    const timestamp = new Date();
    const photoData = {
      id: Date.now().toString(),
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      timestamp: timestamp.toLocaleString('de-DE'),
      location: location,
      description: `Foto aufgenommen um ${timestamp.toLocaleTimeString('de-DE')}`,
      type: 'camera'
    };
    
    setCapturedPhotos(prev => [...prev, photoData]);
    if (onPhotoCapture) {
      onPhotoCapture(photoData);
    }
    
    stopCamera();
    setIsCapturing(false);
  };

  // Datei-Upload verarbeiten
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const location = await getCurrentLocation();
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const timestamp = new Date();
          const photoData = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataUrl: e.target.result,
            timestamp: timestamp.toLocaleString('de-DE'),
            location: location,
            description: `${file.name} - ${timestamp.toLocaleTimeString('de-DE')}`,
            type: 'upload',
            fileName: file.name,
            fileSize: file.size
          };
          
          setCapturedPhotos(prev => [...prev, photoData]);
          if (onPhotoCapture) {
            onPhotoCapture(photoData);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    
    setUploading(false);
    event.target.value = ''; // Reset file input
  };

  // Foto löschen
  const deletePhoto = (photoId) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Foto-Dokumentation</h3>
      
      {/* Kamera-Ansicht */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black text-white">
            <h3 className="text-lg font-medium">Foto aufnehmen</h3>
            <button onClick={stopCamera} className="text-white hover:text-gray-300">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <Camera className="h-8 w-8 text-gray-800" />
              </button>
            </div>
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
      
      {/* Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={startCamera}
          disabled={showCamera}
          className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
        >
          <Camera className="h-5 w-5 mr-2" />
          Kamera öffnen
        </button>
        
        <label className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-green-700 cursor-pointer">
          <Upload className="h-5 w-5 mr-2" />
          {uploading ? 'Wird hochgeladen...' : 'Datei auswählen'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
      
      {/* Foto-Galerie */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capturedPhotos.map(photo => (
          <div key={photo.id} className="bg-gray-50 rounded-lg overflow-hidden shadow">
            <div className="relative">
              <img
                src={photo.dataUrl}
                alt={photo.description}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-3">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <Clock className="h-3 w-3 mr-1" />
                {photo.timestamp}
              </div>
              
              {photo.location && (
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {photo.location.lat.toFixed(6)}, {photo.location.lng.toFixed(6)}
                </div>
              )}
              
              <p className="text-sm text-gray-700">{photo.description}</p>
              
              {photo.fileSize && (
                <p className="text-xs text-gray-400 mt-1">
                  {(photo.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {capturedPhotos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Image className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Noch keine Fotos aufgenommen</p>
          <p className="text-sm">Verwenden Sie die Kamera oder laden Sie Dateien hoch</p>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;