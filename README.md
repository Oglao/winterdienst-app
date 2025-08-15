# Winterdienst Management App

Eine vollständige Lösung für das Management von Winterdienst-Teams mit Live-Tracking, Routen-Planung und Foto-Dokumentation.

## Features

- 📍 **Live GPS-Tracking** der Mitarbeiter
- 🗺️ **Interaktive Karten** mit Leaflet/OpenStreetMap
- ⏱️ **Arbeitszeit-Erfassung** mit Start/Stop/Pause
- 📷 **Foto-Dokumentation** für Arbeitsfortschritt
- 📋 **Tour-Planung** und Route-Management
- 🌨️ **Wetter-Integration** und Bedingungsanzeige
- 📱 **Mobile-responsive** Design
- 🔄 **Real-time Updates** via Socket.IO
- 📊 **Dashboard** mit Live-Statistiken

## Technologie-Stack

### Frontend
- **React 18** mit Hooks
- **Tailwind CSS** für Styling
- **Leaflet** für interaktive Karten
- **Socket.IO Client** für Real-time Updates
- **Axios** für API-Calls
- **Lucide React** für Icons

### Backend
- **Node.js** mit Express
- **PostgreSQL** mit Knex.js
- **PostgREST** für Auto-API Generation
- **Socket.IO** für Real-time Communication
- **JWT** für Authentication
- **Multer** für File Uploads
- **Helmet** für Security
- **Joi** für Input-Validierung

## Installation

### Voraussetzungen
- Node.js (v16 oder höher)
- PostgreSQL (v13 oder höher)
- PostgREST (v11 oder höher)
- Git

### Quick Start

```bash
# 1. Repository klonen/erstellen
git clone <repository-url>
cd winterdienst-app

# 2. Dependencies installieren
npm run install-all

# 3. Environment-Variablen konfigurieren
cp .env.example .env
cp server/.env.example server/.env

# 4. PostgreSQL starten und Datenbank einrichten
# Windows: net start postgresql-x64-14
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# 5. Datenbank-Schema erstellen
cd server && npm run db:setup

# 6. PostgREST installieren und starten
# macOS: brew install postgrest
# Linux: siehe https://postgrest.org/en/stable/install.html
postgrest postgrest.conf &

# 7. Development starten
npm run dev
```

Die App läuft dann auf:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgREST API: http://localhost:3001

## Projektstruktur

```
winterdienst-app/
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Map/
│   │   ├── Routes/
│   │   ├── Tracking/
│   │   └── Common/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   └── styles/
├── server/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.js
└── .vscode/
```

## Verfügbare Scripts

```bash
# Development
npm run dev          # Startet Frontend + Backend
npm start           # Nur Frontend
npm run server      # Nur Backend

# Build & Test
npm run build       # Production Build
npm test           # Tests ausführen

# Installation
npm run install-all # Installiert alle Dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Benutzer-Login
- `POST /api/auth/register` - Benutzer-Registrierung

### Users
- `GET /api/users` - Alle Benutzer
- `POST /api/users` - Neuen Benutzer erstellen
- `PUT /api/users/:id` - Benutzer aktualisieren

### Routes
- `GET /api/routes` - Alle Routen
- `POST /api/routes` - Neue Route erstellen
- `PUT /api/routes/:id` - Route aktualisieren

### Tracking
- `POST /api/tracking/start` - Arbeitszeit starten
- `POST /api/tracking/location` - GPS-Position aktualisieren
- `POST /api/tracking/stop` - Arbeitszeit beenden

## Environment-Variablen

### Frontend (.env)
```bash
# API-Konfiguration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# App-Informationen
REACT_APP_APP_NAME=Winterdienst Manager
REACT_APP_VERSION=1.0.0
```

### Backend (server/.env)
```bash
# Datenbank-Verbindung
MONGODB_URI=mongodb://localhost:27017/winterdienst

# Sicherheit
JWT_SECRET=winterdienst_super_secure_jwt_secret_2024

# Server-Konfiguration
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Wichtig:** Kopieren Sie die .env.example Dateien und passen Sie die Werte an:
```bash
cp .env.example .env
cp server/.env.example server/.env
```

## Deployment

### Frontend (Vercel)
```bash
npm run build
npx vercel --prod
```

### Backend (Railway)
```bash
railway login
railway init
railway up
```

### Database (MongoDB Atlas)
1. Account erstellen auf [mongodb.com](https://mongodb.com)
2. Cluster erstellen
3. Connection String in `MONGODB_URI` einfügen

## Mobile App

Für Android/iPhone können Sie eine React Native Version erstellen:

```bash
npx react-native init WinterdienstMobile
# Oder mit Expo:
npx create-expo-app WinterdienstMobile
```

## Troubleshooting

### Häufige Probleme

**MongoDB Verbindung fehlgeschlagen:**
```bash
# MongoDB starten
# Windows:
net start MongoDB

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

**Port bereits belegt:**
- Frontend: Port 3000 in package.json ändern
- Backend: PORT in server/.env ändern

**Module nicht gefunden:**
```bash
npm run install-all
```

## Contributing

1. Fork das Projekt
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie die Console auf Fehlermeldungen
2. Stellen Sie sicher, dass MongoDB läuft
3. Überprüfen Sie die Environment-Variablen
4. Erstellen Sie ein Issue auf GitHub