// Photo Upload Service für Cloud-Upload
class PhotoUploadService {
  constructor() {
    this.uploadEndpoint = process.env.REACT_APP_UPLOAD_ENDPOINT || '/api/photos/upload';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  }

  // Foto zu Base64 konvertieren
  dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  // Foto komprimieren
  compressImage(file, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Bildgröße berechnen (Seitenverhältnis beibehalten)
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Bild zeichnen und komprimieren
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Validierung
  validateFile(file) {
    const errors = [];

    if (!this.allowedTypes.includes(file.type)) {
      errors.push(`Dateityp ${file.type} nicht unterstützt. Erlaubt: ${this.allowedTypes.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      errors.push(`Datei zu groß (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    return errors;
  }

  // Foto zur Cloud hochladen
  async uploadPhoto(photoData, progressCallback) {
    try {
      let file;
      
      // Konvertierung je nach Input-Typ
      if (photoData.dataUrl) {
        file = this.dataURLtoBlob(photoData.dataUrl);
      } else if (photoData.file) {
        file = photoData.file;
      } else {
        throw new Error('Keine gültigen Foto-Daten gefunden');
      }

      // Validierung
      const validationErrors = this.validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Komprimierung
      const compressedFile = await this.compressImage(file);

      // FormData erstellen
      const formData = new FormData();
      formData.append('photo', compressedFile, `photo_${Date.now()}.jpg`);
      formData.append('metadata', JSON.stringify({
        timestamp: photoData.timestamp,
        location: photoData.location,
        description: photoData.description,
        workSessionId: photoData.workSessionId,
        routeId: photoData.routeId,
        userId: photoData.userId
      }));

      // Upload mit Progress-Tracking
      const response = await fetch(this.uploadEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload fehlgeschlagen: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        photoId: result.id,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        metadata: result.metadata
      };

    } catch (error) {
      console.error('Photo upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mehrere Fotos parallel hochladen
  async uploadPhotos(photosData, progressCallback) {
    const results = [];
    const totalPhotos = photosData.length;
    
    for (let i = 0; i < totalPhotos; i++) {
      const photoData = photosData[i];
      
      if (progressCallback) {
        progressCallback(i, totalPhotos, `Uploading ${i + 1}/${totalPhotos}`);
      }

      const result = await this.uploadPhoto(photoData);
      results.push(result);
    }

    if (progressCallback) {
      progressCallback(totalPhotos, totalPhotos, 'Upload abgeschlossen');
    }

    return results;
  }

  // Offline-Upload Queue (für PWA)
  queueForUpload(photoData) {
    const queue = JSON.parse(localStorage.getItem('photoUploadQueue') || '[]');
    queue.push({
      ...photoData,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('photoUploadQueue', JSON.stringify(queue));
  }

  // Warteschlange abarbeiten
  async processUploadQueue() {
    const queue = JSON.parse(localStorage.getItem('photoUploadQueue') || '[]');
    
    if (queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const remainingQueue = [];

    for (const photoData of queue) {
      const result = await this.uploadPhoto(photoData);
      
      if (result.success) {
        processed++;
      } else {
        failed++;
        remainingQueue.push(photoData);
      }
    }

    // Aktualisierte Warteschlange speichern
    localStorage.setItem('photoUploadQueue', JSON.stringify(remainingQueue));

    return { processed, failed, remaining: remainingQueue.length };
  }
}

export default new PhotoUploadService();