const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { pool } = require('../database/db');
const auth = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validation');
const { photoSchemas, paramSchemas } = require('../validation/schemas');

// Multer-Konfiguration für Memory Storage (für Sharp-Processing)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximal 10 Dateien gleichzeitig
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Dateityp ${file.mimetype} nicht unterstützt`), false);
    }
  }
});

// Upload-Verzeichnisse erstellen
const ensureUploadDirs = async () => {
  const uploadDir = path.join(__dirname, '../uploads/photos');
  const thumbnailDir = path.join(uploadDir, 'thumbnails');
  
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(thumbnailDir, { recursive: true });
  } catch (error) {
    console.error('Fehler beim Erstellen der Upload-Verzeichnisse:', error);
  }
};

// Bild verarbeiten und speichern
const processAndSaveImage = async (buffer, filename) => {
  const uploadDir = path.join(__dirname, '../uploads/photos');
  const thumbnailDir = path.join(uploadDir, 'thumbnails');
  
  const originalPath = path.join(uploadDir, filename);
  const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);
  
  // Original-Bild speichern (komprimiert)
  await sharp(buffer)
    .jpeg({ quality: 85, mozjpeg: true })
    .resize(1920, 1920, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .toFile(originalPath);
  
  // Thumbnail erstellen
  await sharp(buffer)
    .jpeg({ quality: 70 })
    .resize(300, 300, { 
      fit: 'cover' 
    })
    .toFile(thumbnailPath);
  
  return {
    originalPath,
    thumbnailPath,
    filename
  };
};

// Foto hochladen (Ersetzt durch moderne Version)
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  try {
    await ensureUploadDirs();
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Keine Datei hochgeladen' 
      });
    }

    // Metadaten parsen
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        console.warn('Ungültige Metadaten:', error);
      }
    }

    // Eindeutigen Dateinamen generieren
    const photoId = uuidv4();
    const fileExtension = '.jpg'; // Immer als JPEG speichern
    const filename = `${photoId}${fileExtension}`;

    // Bild verarbeiten und speichern
    const { originalPath, thumbnailPath } = await processAndSaveImage(req.file.buffer, filename);

    // GPS-Koordinaten extrahieren
    let location = null;
    if (metadata.location && metadata.location.lat && metadata.location.lng) {
      location = `POINT(${metadata.location.lng} ${metadata.location.lat})`;
    }

    // In Datenbank speichern
    const query = `
      INSERT INTO photos (
        id, user_id, work_session_id, route_id, filename, 
        file_path, thumbnail_path, file_size, description, 
        location, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const values = [
      photoId,
      req.user.id,
      metadata.workSessionId || null,
      metadata.routeId || null,
      filename,
      originalPath,
      thumbnailPath,
      req.file.size,
      metadata.description || 'Arbeitsfortschritt',
      location,
      JSON.stringify(metadata)
    ];

    const result = await pool.query(query, values);
    const photo = result.rows[0];

    // URLs für Frontend erstellen
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Real-time Update
    if (req.io) {
      req.io.emit('photo-uploaded', {
        id: photo.id,
        userId: req.user.id,
        workSessionId: metadata.workSessionId,
        routeId: metadata.routeId,
        timestamp: photo.created_at
      });
    }
    
    res.json({
      success: true,
      id: photo.id,
      url: `${baseUrl}/api/photos/${photo.id}/image`,
      thumbnailUrl: `${baseUrl}/api/photos/${photo.id}/thumbnail`,
      metadata: {
        timestamp: photo.created_at,
        location: metadata.location,
        description: photo.description,
        fileSize: photo.file_size
      }
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler beim Hochladen des Fotos: ' + error.message 
    });
  }
});

// Foto abrufen (Original)
router.get('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT file_path, filename FROM photos WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Foto nicht gefunden' });
    }
    
    const photo = result.rows[0];
    const filePath = photo.file_path;
    
    // Prüfen ob Datei existiert
    try {
      await fs.access(filePath);
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      res.status(404).json({ message: 'Foto-Datei nicht gefunden' });
    }
    
  } catch (error) {
    console.error('Error serving photo:', error);
    res.status(500).json({ message: 'Fehler beim Laden des Fotos' });
  }
});

// Thumbnail abrufen
router.get('/:id/thumbnail', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT thumbnail_path, filename FROM photos WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Foto nicht gefunden' });
    }
    
    const photo = result.rows[0];
    const thumbnailPath = photo.thumbnail_path;
    
    // Prüfen ob Thumbnail existiert
    try {
      await fs.access(thumbnailPath);
      res.sendFile(path.resolve(thumbnailPath));
    } catch (error) {
      res.status(404).json({ message: 'Thumbnail nicht gefunden' });
    }
    
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({ message: 'Fehler beim Laden des Thumbnails' });
  }
});

// Fotos für Session abrufen (Modernisiert)
router.get('/session/:sessionId', auth, validateParams(paramSchemas.id), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const query = `
      SELECT 
        id, filename, description, created_at, 
        location, metadata, file_size
      FROM photos 
      WHERE work_session_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [sessionId]);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const photos = result.rows.map(photo => ({
      id: photo.id,
      description: photo.description,
      timestamp: photo.created_at,
      location: photo.location,
      metadata: photo.metadata,
      fileSize: photo.file_size,
      url: `${baseUrl}/api/photos/${photo.id}/image`,
      thumbnailUrl: `${baseUrl}/api/photos/${photo.id}/thumbnail`
    }));
    
    res.json(photos);
    
  } catch (error) {
    console.error('Error fetching session photos:', error);
    res.status(500).json({ message: 'Fehler beim Laden der Fotos' });
  }
});

module.exports = router;
