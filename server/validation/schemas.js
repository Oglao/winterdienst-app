const Joi = require('joi');

// User Validation Schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'Name muss mindestens 2 Zeichen haben',
        'string.max': 'Name darf höchstens 100 Zeichen haben',
        'any.required': 'Name ist erforderlich'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Gültige E-Mail-Adresse erforderlich',
        'any.required': 'E-Mail ist erforderlich'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Passwort muss mindestens 6 Zeichen haben',
        'any.required': 'Passwort ist erforderlich'
      }),
    role: Joi.string().valid('worker', 'admin').default('worker')
  }),
  
  login: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Gültige E-Mail-Adresse erforderlich',
        'any.required': 'E-Mail ist erforderlich'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Passwort ist erforderlich'
      })
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('worker', 'admin')
  }).min(1)
};

// Route Validation Schemas
const routeSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'string.min': 'Routenname muss mindestens 2 Zeichen haben',
        'string.max': 'Routenname darf höchstens 100 Zeichen haben',
        'any.required': 'Routenname ist erforderlich'
      }),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
      .messages({
        'string.pattern.base': 'Startzeit muss im Format HH:MM sein',
        'any.required': 'Startzeit ist erforderlich'
      }),
    estimatedDuration: Joi.string().required()
      .messages({
        'any.required': 'Geschätzte Dauer ist erforderlich'
      }),
    priority: Joi.string().valid('niedrig', 'mittel', 'hoch').required()
      .messages({
        'any.only': 'Priorität muss niedrig, mittel oder hoch sein',
        'any.required': 'Priorität ist erforderlich'
      }),
    assignedWorker: Joi.string().required()
      .messages({
        'any.required': 'Zugewiesener Mitarbeiter ist erforderlich'
      }),
    coordinates: Joi.array().items(
      Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      })
    ).min(1).required()
      .messages({
        'array.min': 'Mindestens eine Koordinate ist erforderlich',
        'any.required': 'Koordinaten sind erforderlich'
      })
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    estimatedDuration: Joi.string(),
    priority: Joi.string().valid('niedrig', 'mittel', 'hoch'),
    status: Joi.string().valid('geplant', 'in_arbeit', 'abgeschlossen'),
    assignedWorker: Joi.string(),
    coordinates: Joi.array().items(
      Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      })
    ).min(1)
  }).min(1)
};

// Tracking Validation Schemas
const trackingSchemas = {
  start: Joi.object({
    workerId: Joi.string().required()
      .messages({
        'any.required': 'Mitarbeiter-ID ist erforderlich'
      }),
    routeId: Joi.string().required()
      .messages({
        'any.required': 'Routen-ID ist erforderlich'
      }),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
  }),
  
  locationUpdate: Joi.object({
    workerId: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required(),
    timestamp: Joi.date().default(Date.now)
  }),
  
  stop: Joi.object({
    workerId: Joi.string().required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
  })
};

// Photo Validation Schemas
const photoSchemas = {
  upload: Joi.object({
    workerId: Joi.string().required()
      .messages({
        'any.required': 'Mitarbeiter-ID ist erforderlich'
      }),
    routeId: Joi.string().required()
      .messages({
        'any.required': 'Routen-ID ist erforderlich'
      }),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).required()
      .messages({
        'any.required': 'Standort ist erforderlich'
      }),
    description: Joi.string().max(500).required()
      .messages({
        'string.max': 'Beschreibung darf höchstens 500 Zeichen haben',
        'any.required': 'Beschreibung ist erforderlich'
      })
  })
};

// Common Parameter Schemas
const paramSchemas = {
  id: Joi.object({
    id: Joi.string().required()
      .messages({
        'any.required': 'ID ist erforderlich'
      })
  })
};

// Vehicle Validation Schemas
const vehicleValidation = Joi.object({
  license_plate: Joi.string().min(2).max(20).required()
    .messages({
      'string.min': 'Kennzeichen muss mindestens 2 Zeichen haben',
      'string.max': 'Kennzeichen darf höchstens 20 Zeichen haben',
      'any.required': 'Kennzeichen ist erforderlich'
    }),
  brand: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'Marke muss mindestens 2 Zeichen haben',
      'string.max': 'Marke darf höchstens 100 Zeichen haben',
      'any.required': 'Marke ist erforderlich'
    }),
  model: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'Modell muss mindestens 1 Zeichen haben',
      'string.max': 'Modell darf höchstens 100 Zeichen haben',
      'any.required': 'Modell ist erforderlich'
    }),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required()
    .messages({
      'number.min': 'Baujahr muss mindestens 1900 sein',
      'number.max': `Baujahr darf höchstens ${new Date().getFullYear() + 1} sein`,
      'any.required': 'Baujahr ist erforderlich'
    }),
  fuel_type: Joi.string().valid('diesel', 'benzin', 'elektro', 'hybrid').default('diesel'),
  tank_capacity: Joi.number().positive().max(1000).required()
    .messages({
      'number.positive': 'Tankkapazität muss positiv sein',
      'number.max': 'Tankkapazität darf höchstens 1000 Liter betragen',
      'any.required': 'Tankkapazität ist erforderlich'
    }),
  current_fuel_level: Joi.number().min(0).max(Joi.ref('tank_capacity')).allow(null),
  assigned_user_id: Joi.string().allow(null)
});

const fuelEntryValidation = Joi.object({
  amount: Joi.number().positive().max(1000).required()
    .messages({
      'number.positive': 'Getankte Menge muss positiv sein',
      'number.max': 'Getankte Menge darf höchstens 1000 Liter betragen',
      'any.required': 'Getankte Menge ist erforderlich'
    }),
  cost: Joi.number().positive().max(10000).allow(null)
    .messages({
      'number.positive': 'Kosten müssen positiv sein',
      'number.max': 'Kosten dürfen höchstens 10.000€ betragen'
    }),
  price_per_liter: Joi.number().positive().max(10).allow(null)
    .messages({
      'number.positive': 'Preis pro Liter muss positiv sein',
      'number.max': 'Preis pro Liter darf höchstens 10€ betragen'
    }),
  location: Joi.string().max(255).allow(null, ''),
  mileage: Joi.number().integer().min(0).max(9999999).allow(null)
    .messages({
      'number.min': 'KM-Stand muss mindestens 0 sein',
      'number.max': 'KM-Stand darf höchstens 9.999.999 betragen'
    }),
  is_full_tank: Joi.boolean().default(false),
  new_fuel_level: Joi.number().min(0).max(1000).allow(null),
  notes: Joi.string().max(500).allow(null, '')
});

module.exports = {
  userSchemas,
  routeSchemas,
  trackingSchemas,
  photoSchemas,
  paramSchemas,
  vehicleValidation,
  fuelEntryValidation
};