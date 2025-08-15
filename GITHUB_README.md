# Winterdienst Management App

🚀 **Moderne Winterdienst-Management-Anwendung mit KI-Features**

## 🌟 Features

### Core Features
- 📍 **Live GPS-Tracking** der Mitarbeiter
- 🗺️ **Interaktive Karten** mit Leaflet/OpenStreetMap  
- ⏱️ **Arbeitszeit-Erfassung** mit Start/Stop/Pause
- 📷 **Foto-Dokumentation** für Arbeitsfortschritt
- 📋 **Tour-Planung** und Route-Management

### 🆕 Neue KI-Features  
- 🔍 **QR-Code Scanner** für Routen & Fahrzeuge
- 🎤 **Sprachaufnahmen** für Notizen
- 📦 **Barcode-Scanner** für Material-Erfassung  
- 🧠 **KI-Wettervorhersage** mit Arbeitsbelastung
- ⚡ **Automatische Routenoptimierung** (3 Algorithmen)

### 📱 Mobile Features
- 📱 **Mobile-responsive** Design
- 🔄 **Real-time Updates** via Socket.IO
- 📊 **Dashboard** mit Live-Statistiken
- 🌨️ **Wetter-Integration**

## 🛠️ Technologie-Stack

### Frontend
- **React 19** mit Hooks
- **Tailwind CSS** für Styling  
- **Leaflet** für interaktive Karten
- **Socket.IO Client** für Real-time Updates
- **HTML5 QR/Barcode Scanner**

### Backend  
- **Node.js** mit Express
- **PostgreSQL** mit Knex.js
- **PostgREST** für Auto-API Generation
- **Socket.IO** für Real-time Communication
- **JWT** für Authentication

## 🚀 Installation & Start

```bash
# Repository klonen
git clone https://github.com/IHR_USERNAME/winterdienst-app.git
cd winterdienst-app

# Dependencies installieren
npm install
cd server && npm install && cd ..

# Environment-Variablen konfigurieren
cp .env.example .env
cp server/.env.example server/.env

# App starten
npm start                    # Frontend (Port 3000)
cd server && npm start      # Backend (Port 5000)
```

## 📱 Mobile Testing

**Handy im gleichen WLAN:**
- Frontend: http://[IHRE-IP]:3000  
- Alle Features funktionieren mobil!

## 🎯 Features im Detail

### QR-Code Scanner
- Routen-QR-Codes scannen
- Fahrzeug Check-in/out
- Material-Tracking

### Sprachnotizen  
- Audio-Aufnahme mit Mikrofon
- Wiedergabe und Download
- Automatic Logging

### KI-Wettervorhersage
- 7-Tage Vorhersage
- Arbeitsbelastung-Berechnung  
- Automatische Empfehlungen

### Route-Optimierung
- Genetischer Algorithmus
- Simulated Annealing  
- Greedy-Algorithmus
- Fuel & Time Optimization

---

**🤖 Generated with Claude Code**
