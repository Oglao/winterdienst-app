// Route Optimization Service mit Google Maps/MapBox Integration
class RouteOptimizationService {
  constructor() {
    this.googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.mapboxApiKey = process.env.REACT_APP_MAPBOX_API_KEY;
    this.provider = this.googleMapsApiKey ? 'google' : this.mapboxApiKey ? 'mapbox' : 'osrm';
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 Minuten Cache
  }

  // Cache-Management
  getCacheKey(points, options = {}) {
    const pointsStr = points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
    const optionsStr = JSON.stringify(options);
    return `${this.provider}_${pointsStr}_${optionsStr}`;
  }

  getCachedRoute(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedRoute(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Google Maps Directions API
  async optimizeRouteGoogle(waypoints, options = {}) {
    if (!this.googleMapsApiKey) {
      throw new Error('Google Maps API Key nicht konfiguriert');
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(1, -1);

    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: this.googleMapsApiKey,
      optimize: 'true',
      avoid: options.avoidTolls ? 'tolls' : '',
      departure_time: options.departureTime || 'now',
      traffic_model: 'best_guess',
      units: 'metric'
    });

    if (intermediateWaypoints.length > 0) {
      const waypointsStr = intermediateWaypoints
        .map(wp => `${wp.lat},${wp.lng}`)
        .join('|');
      params.append('waypoints', `optimize:true|${waypointsStr}`);
    }

    try {
      const response = await fetch(`${baseUrl}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Maps API Fehler: ${data.status}`);
      }

      return this.parseGoogleDirectionsResponse(data, waypoints);
    } catch (error) {
      console.error('Google Maps API Fehler:', error);
      throw error;
    }
  }

  // MapBox Optimization API
  async optimizeRouteMapbox(waypoints, options = {}) {
    if (!this.mapboxApiKey) {
      throw new Error('MapBox API Key nicht konfiguriert');
    }

    const coordinates = waypoints
      .map(wp => `${wp.lng},${wp.lat}`)
      .join(';');

    const profile = options.profile || 'driving';
    const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/${profile}/${coordinates}`;

    const params = new URLSearchParams({
      access_token: this.mapboxApiKey,
      steps: 'true',
      geometries: 'geojson',
      overview: 'full'
    });

    if (options.roundtrip !== undefined) {
      params.append('roundtrip', options.roundtrip);
    }

    if (options.source && options.destination) {
      params.append('source', options.source);
      params.append('destination', options.destination);
    }

    try {
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error(`MapBox API Fehler: ${data.code}`);
      }

      return this.parseMapboxOptimizationResponse(data, waypoints);
    } catch (error) {
      console.error('MapBox API Fehler:', error);
      throw error;
    }
  }

  // OSRM Fallback (Open Source) mit Timeout
  async optimizeRouteOSRM(waypoints, options = {}) {
    const coordinates = waypoints
      .map(wp => `${wp.lng},${wp.lat}`)
      .join(';');

    const profile = options.profile || 'driving';
    const url = `https://router.project-osrm.org/trip/v1/${profile}/${coordinates}`;

    const params = new URLSearchParams({
      steps: 'true',
      geometries: 'geojson',
      overview: 'full',
      source: options.source || 'first',
      destination: options.destination || 'last'
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const response = await fetch(`${url}?${params}`, {
        signal: controller.signal,
        mode: 'cors'
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error(`OSRM API Fehler: ${data.code}`);
      }

      return this.parseOSRMTripResponse(data, waypoints);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('OSRM timeout, generating mock route');
        return this.generateMockRoute(waypoints);
      }
      console.error('OSRM API Fehler:', error);
      return this.generateMockRoute(waypoints);
    }
  }

  // Hauptfunktion für Routenoptimierung
  async optimizeRoute(waypoints, options = {}) {
    if (waypoints.length < 2) {
      throw new Error('Mindestens 2 Waypoints erforderlich');
    }

    const cacheKey = this.getCacheKey(waypoints, options);
    const cached = this.getCachedRoute(cacheKey);
    if (cached) {
      return cached;
    }

    let result;
    
    try {
      switch (this.provider) {
        case 'google':
          result = await this.optimizeRouteGoogle(waypoints, options);
          break;
        case 'mapbox':
          result = await this.optimizeRouteMapbox(waypoints, options);
          break;
        default:
          result = await this.optimizeRouteOSRM(waypoints, options);
      }

      // Winterdienst-spezifische Optimierungen hinzufügen
      result = await this.applyWinterServiceOptimizations(result, options);
      
      this.setCachedRoute(cacheKey, result);
      return result;
    } catch (error) {
      // Fallback zu OSRM bei API-Fehlern
      if (this.provider !== 'osrm') {
        console.warn(`${this.provider} API nicht verfügbar, verwende OSRM Fallback`);
        result = await this.optimizeRouteOSRM(waypoints, options);
        result = await this.applyWinterServiceOptimizations(result, options);
        this.setCachedRoute(cacheKey, result);
        return result;
      }
      throw error;
    }
  }

  // Google Directions Response parsen
  parseGoogleDirectionsResponse(data, originalWaypoints) {
    const route = data.routes[0];
    const leg = route.legs[0];

    // Optimierte Reihenfolge der Waypoints
    const waypointOrder = route.waypoint_order || [];
    const optimizedWaypoints = [originalWaypoints[0]]; // Start
    waypointOrder.forEach(index => {
      optimizedWaypoints.push(originalWaypoints[index + 1]);
    });
    optimizedWaypoints.push(originalWaypoints[originalWaypoints.length - 1]); // Ende

    // Koordinaten aus encoded polyline extrahieren
    const coordinates = this.decodePolyline(route.overview_polyline.points);

    return {
      provider: 'google',
      distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0), // Meter
      duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0), // Sekunden
      durationInTraffic: route.legs.reduce((sum, leg) => 
        sum + (leg.duration_in_traffic?.value || leg.duration.value), 0),
      coordinates: coordinates,
      optimizedWaypoints: optimizedWaypoints,
      steps: this.parseGoogleSteps(route.legs),
      warnings: route.warnings || [],
      copyrights: route.copyrights
    };
  }

  // MapBox Optimization Response parsen
  parseMapboxOptimizationResponse(data, originalWaypoints) {
    const trip = data.trips[0];
    
    return {
      provider: 'mapbox',
      distance: trip.distance, // Meter
      duration: trip.duration, // Sekunden
      coordinates: trip.geometry.coordinates.map(coord => ({ lat: coord[1], lng: coord[0] })),
      optimizedWaypoints: trip.waypoints.map(wp => ({
        lat: wp.location[1],
        lng: wp.location[0],
        waypointIndex: wp.waypoint_index
      })),
      steps: this.parseMapboxSteps(trip.legs),
      code: data.code
    };
  }

  // OSRM Trip Response parsen
  parseOSRMTripResponse(data, originalWaypoints) {
    const trip = data.trips[0];
    
    return {
      provider: 'osrm',
      distance: trip.distance, // Meter
      duration: trip.duration, // Sekunden
      coordinates: trip.geometry.coordinates.map(coord => ({ lat: coord[1], lng: coord[0] })),
      optimizedWaypoints: trip.waypoints.map(wp => ({
        lat: wp.location[1],
        lng: wp.location[0],
        waypointIndex: wp.waypoint_index
      })),
      steps: this.parseOSRMSteps(trip.legs),
      code: data.code
    };
  }

  // Google Steps parsen
  parseGoogleSteps(legs) {
    const steps = [];
    legs.forEach(leg => {
      leg.steps.forEach(step => {
        steps.push({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value,
          duration: step.duration.value,
          startLocation: step.start_location,
          endLocation: step.end_location
        });
      });
    });
    return steps;
  }

  // MapBox Steps parsen
  parseMapboxSteps(legs) {
    const steps = [];
    legs.forEach(leg => {
      leg.steps.forEach(step => {
        steps.push({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          startLocation: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] }
        });
      });
    });
    return steps;
  }

  // OSRM Steps parsen
  parseOSRMSteps(legs) {
    const steps = [];
    legs.forEach(leg => {
      leg.steps.forEach(step => {
        steps.push({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          startLocation: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] }
        });
      });
    });
    return steps;
  }

  // Winterdienst-spezifische Optimierungen
  async applyWinterServiceOptimizations(route, options = {}) {
    const optimized = { ...route };

    // Prioritäts-basierte Neuordnung
    if (options.priorities) {
      optimized.optimizedWaypoints = this.reorderByPriority(
        optimized.optimizedWaypoints, 
        options.priorities
      );
    }

    // Wetter-basierte Anpassungen
    if (options.weatherData) {
      optimized.weatherAdjustments = this.calculateWeatherAdjustments(
        route, 
        options.weatherData
      );
      optimized.estimatedDuration = route.duration * optimized.weatherAdjustments.timeFactor;
    }

    // Fahrzeug-spezifische Anpassungen
    if (options.vehicleType) {
      optimized.vehicleAdjustments = this.calculateVehicleAdjustments(
        route, 
        options.vehicleType
      );
    }

    // Salz-/Streumittel-Empfehlungen
    optimized.saltingRecommendations = this.calculateSaltingRecommendations(
      route, 
      options.weatherData
    );

    return optimized;
  }

  // Prioritäts-basierte Neuordnung
  reorderByPriority(waypoints, priorities) {
    const start = waypoints[0];
    const end = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1);

    // Nach Priorität sortieren (höchste zuerst)
    const sortedMiddle = middle.sort((a, b) => {
      const aPriority = priorities[a.waypointIndex] || 0;
      const bPriority = priorities[b.waypointIndex] || 0;
      return bPriority - aPriority;
    });

    return [start, ...sortedMiddle, end];
  }

  // Wetter-Anpassungen berechnen
  calculateWeatherAdjustments(route, weatherData) {
    let timeFactor = 1.0;
    let fuelFactor = 1.0;
    let recommendations = [];

    if (weatherData.temperature <= 0) {
      timeFactor *= 1.3; // 30% länger bei Frost
      fuelFactor *= 1.2;
      recommendations.push('Erhöhte Fahrzeit durch Frost einkalkuliert');
    }

    if (weatherData.condition.includes('Schnee')) {
      timeFactor *= 1.5; // 50% länger bei Schnee
      fuelFactor *= 1.4;
      recommendations.push('Stark erhöhte Fahrzeit durch Schnefall');
    }

    if (weatherData.windSpeed > 50) {
      timeFactor *= 1.2;
      recommendations.push('Vorsicht bei starkem Wind');
    }

    return {
      timeFactor,
      fuelFactor,
      recommendations
    };
  }

  // Fahrzeug-Anpassungen
  calculateVehicleAdjustments(route, vehicleType) {
    const adjustments = {
      'small_truck': { speedFactor: 0.9, fuelConsumption: 0.08 },
      'large_truck': { speedFactor: 0.8, fuelConsumption: 0.12 },
      'spreader': { speedFactor: 0.7, fuelConsumption: 0.15 }
    };

    return adjustments[vehicleType] || adjustments['small_truck'];
  }

  // Salzungs-Empfehlungen
  calculateSaltingRecommendations(route, weatherData) {
    if (!weatherData) return [];

    const recommendations = [];
    const distance = route.distance / 1000; // km

    if (weatherData.temperature <= -5) {
      recommendations.push({
        type: 'heavy_salting',
        amount: Math.round(distance * 25), // 25g/m²
        material: 'NaCl + Sand',
        description: 'Starke Salzung mit Sand'
      });
    } else if (weatherData.temperature <= 0) {
      recommendations.push({
        type: 'normal_salting',
        amount: Math.round(distance * 15), // 15g/m²
        material: 'NaCl',
        description: 'Normale Salzung'
      });
    } else if (weatherData.temperature <= 3 && weatherData.condition.includes('Regen')) {
      recommendations.push({
        type: 'preventive_salting',
        amount: Math.round(distance * 8), // 8g/m²
        material: 'NaCl',
        description: 'Präventive Salzung'
      });
    }

    return recommendations;
  }

  // Mock Route Generator für Offline/Fallback
  generateMockRoute(waypoints) {
    console.log('Route Service: Generating mock route for', waypoints.length, 'waypoints');
    
    // Einfache Berechnung zwischen Punkten
    let totalDistance = 0;
    let totalDuration = 0;
    const coordinates = [];
    
    for (let i = 0; i < waypoints.length; i++) {
      const current = waypoints[i];
      coordinates.push({ lat: current.lat, lng: current.lng });
      
      if (i < waypoints.length - 1) {
        const next = waypoints[i + 1];
        // Luftlinie * 1.3 für realistische Straßendistanz
        const distance = this.calculateDistance(current, next) * 1.3;
        totalDistance += distance;
        totalDuration += (distance / 1000) * 120; // ~30km/h durchschnitt im Stadtverkehr
        
        // Interpolierte Punkte für smoother Route
        const steps = 5;
        for (let j = 1; j <= steps; j++) {
          const ratio = j / (steps + 1);
          coordinates.push({
            lat: current.lat + (next.lat - current.lat) * ratio,
            lng: current.lng + (next.lng - current.lng) * ratio
          });
        }
      }
    }

    return {
      provider: 'mock',
      distance: Math.round(totalDistance),
      duration: Math.round(totalDuration),
      coordinates: coordinates,
      optimizedWaypoints: waypoints,
      steps: waypoints.map((wp, index) => ({
        instruction: index === 0 ? 'Fahrt beginnen' : 
                    index === waypoints.length - 1 ? 'Ziel erreicht' : 
                    `Weiter zu ${wp.name || 'Waypoint ' + (index + 1)}`,
        distance: index < waypoints.length - 1 ? 
                 this.calculateDistance(waypoints[index], waypoints[index + 1]) * 1.3 : 0,
        duration: index < waypoints.length - 1 ? 
                 (this.calculateDistance(waypoints[index], waypoints[index + 1]) * 1.3 / 1000) * 120 : 0
      })),
      isMockData: true
    };
  }

  // Haversine Distanz-Berechnung
  calculateDistance(point1, point2) {
    const R = 6371000; // Erdradius in Metern
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Google Polyline dekodieren
  decodePolyline(encoded) {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return poly;
  }
}

export default new RouteOptimizationService();