import React, { useState } from 'react';
import { Camera, X, Download, Calendar, MapPin, User } from 'lucide-react';

const PhotoGallery = ({ photos = [], onClose }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filterWorker, setFilterWorker] = useState('');

  // Alle Mitarbeiter aus Fotos extrahieren
  const workers = [...new Set(photos.map(photo => photo.worker).filter(Boolean))];

  // Fotos filtern
  const filteredPhotos = filterWorker 
    ? photos.filter(photo => photo.worker === filterWorker)
    : photos;

  // Foto-Modal
  const PhotoModal = ({ photo, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-[90vh] m-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium">Foto-Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center mb-4">
              <Camera className="h-16 w-16 text-gray-400" />
              <div className="ml-4 text-gray-500">
                <p className="font-medium">Foto-Vorschau</p>
                <p className="text-sm">Datei: {photo.filename || 'foto.jpg'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Aufgenommen am</p>
                <p className="font-medium">{photo.timestamp}</p>
              </div>
              <div>
                <p className="text-gray-500">Mitarbeiter</p>
                <p className="font-medium">{photo.worker}</p>
              </div>
              <div>
                <p className="text-gray-500">Beschreibung</p>
                <p className="font-medium">{photo.description}</p>
              </div>
              <div>
                <p className="text-gray-500">Route</p>
                <p className="font-medium">{photo.route || 'Nicht zugeordnet'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Foto-Übersicht</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterWorker}
            onChange={(e) => setFilterWorker(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">Alle Mitarbeiter</option>
            {workers.map(worker => (
              <option key={worker} value={worker}>{worker}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {filteredPhotos.length} Foto{filteredPhotos.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Noch keine Fotos vorhanden</p>
          <p className="text-sm text-gray-400">Fotos werden hier angezeigt, wenn Mitarbeiter welche aufnehmen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo, index) => (
            <div key={photo.id || index} className="bg-white rounded-lg shadow overflow-hidden">
              <div 
                className="bg-gray-200 h-48 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              
              <div className="p-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  {photo.timestamp}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <User className="h-4 w-4 mr-1" />
                  {photo.worker}
                </div>
                
                {photo.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    GPS: {photo.location.lat?.toFixed(4)}, {photo.location.lng?.toFixed(4)}
                  </div>
                )}
                
                <p className="text-sm text-gray-700 mb-3">{photo.description}</p>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Details anzeigen
                  </button>
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
};

export default PhotoGallery;