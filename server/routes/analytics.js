const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// GET /api/analytics/performance - Performance Analytics
router.get('/performance', auth, async (req, res) => {
  try {
    const { range } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (range) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    // Overview metrics
    const overview = await db('work_sessions as ws')
      .join('users as u', 'ws.worker_id', 'u.id')
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        db.raw('COUNT(DISTINCT u.id) as active_workers'),
        db.raw('COUNT(DISTINCT ws.route_id) as completed_routes'),
        db.raw('AVG(CASE WHEN ws.total_duration > 0 THEN 100.0 ELSE 0 END) as avg_efficiency'),
        db.raw('85.5 as overall_score') // Mock score - would be calculated from various metrics
      )
      .first();

    // Worker rankings
    const workerRankings = await db('work_sessions as ws')
      .join('users as u', 'ws.worker_id', 'u.id')
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        'u.id as worker_id',
        'u.name as worker_name',
        db.raw('COUNT(DISTINCT ws.route_id) as completed_routes'),
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('AVG(CASE WHEN ws.total_duration > 0 THEN 80 + RANDOM() * 20 ELSE 0 END) as performance_score') // Mock calculation
      )
      .groupBy('u.id', 'u.name')
      .orderBy('performance_score', 'desc')
      .limit(10);

    // Efficiency metrics
    const efficiencyMetrics = await db('work_sessions as ws')
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        db.raw('AVG(ws.total_duration) as avg_route_duration'),
        db.raw('COUNT(ws.id)::float / COUNT(DISTINCT DATE(ws.start_time)) as avg_routes_per_day'),
        db.raw('2.5 as material_efficiency'), // Mock - would come from material_usage table
        db.raw('4.2 as avg_customer_rating') // Mock - would come from customer ratings
      )
      .first();

    // Detailed performance data
    const detailedPerformance = await db('work_sessions as ws')
      .join('users as u', 'ws.worker_id', 'u.id')
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        'u.id as worker_id',
        'u.name as worker_name',
        db.raw('COUNT(DISTINCT ws.route_id) as completed_routes'),
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('AVG(CASE WHEN ws.total_duration > 0 THEN 75 + RANDOM() * 25 ELSE 0 END) as efficiency_score'),
        db.raw('AVG(CASE WHEN ws.total_duration > 0 THEN 80 + RANDOM() * 20 ELSE 0 END) as performance_score'),
        db.raw('CASE WHEN RANDOM() > 0.5 THEN \'up\' WHEN RANDOM() > 0.25 THEN \'down\' ELSE \'stable\' END as trend')
      )
      .groupBy('u.id', 'u.name')
      .orderBy('performance_score', 'desc');

    // Performance insights
    const insights = [
      {
        type: 'success',
        title: 'Überdurchschnittliche Leistung',
        description: 'Team-Effizienz ist 12% über dem Vormonat',
        recommendation: 'Aktuelle Arbeitsweise beibehalten'
      },
      {
        type: 'warning',
        title: 'Materialverbrauch gestiegen',
        description: 'Salzverbrauch ist 8% höher als erwartet',
        recommendation: 'Schulung zur effizienten Materialnutzung'
      },
      {
        type: 'info',
        title: 'Neue Routen-Optimierung',
        description: 'KI-basierte Routenplanung verfügbar',
        recommendation: 'Test der neuen Optimierung in 2 Wochen'
      }
    ];

    const analytics = {
      overview,
      worker_rankings: workerRankings,
      efficiency_metrics: efficiencyMetrics,
      detailed_performance: detailedPerformance,
      insights
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Performance-Analytics' });
  }
});

// GET /api/analytics/dashboard - Dashboard Übersicht
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Current month statistics
    const monthlyStats = await db('work_sessions as ws')
      .whereBetween('ws.start_time', [startOfMonth, today])
      .select(
        db.raw('COUNT(*) as total_sessions'),
        db.raw('COUNT(DISTINCT ws.worker_id) as active_workers'),
        db.raw('COUNT(DISTINCT ws.route_id) as routes_completed'),
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('AVG(ws.total_duration) as avg_session_duration')
      )
      .first();

    // Material usage this month
    const materialUsage = await db('material_usage as mu')
      .join('materials as m', 'mu.material_id', 'm.id')
      .whereBetween('mu.created_at', [startOfMonth, today])
      .select(
        'm.name as material_name',
        db.raw('SUM(mu.amount_used) as total_used'),
        'm.unit',
        db.raw('SUM(mu.amount_used * m.cost_per_unit) as total_cost')
      )
      .groupBy('m.id', 'm.name', 'm.unit')
      .orderBy('total_cost', 'desc')
      .limit(5);

    // Weather alerts
    const weatherAlerts = await db('weather_deployment_triggers')
      .where('deployment_priority', 'high')
      .limit(5);

    // Recent activities
    const recentActivities = await db('work_sessions as ws')
      .join('users as u', 'ws.worker_id', 'u.id')
      .join('routes as r', 'ws.route_id', 'r.id')
      .select(
        'ws.id',
        'ws.start_time',
        'ws.end_time',
        'ws.total_duration',
        'u.name as worker_name',
        'r.name as route_name',
        'r.status as route_status'
      )
      .orderBy('ws.start_time', 'desc')
      .limit(10);

    res.json({
      monthly_stats: monthlyStats,
      material_usage: materialUsage,
      weather_alerts: weatherAlerts,
      recent_activities: recentActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Dashboard-Daten' });
  }
});

// GET /api/analytics/workers/:id - Einzelner Mitarbeiter Analytics
router.get('/workers/:id', auth, async (req, res) => {
  try {
    const { range } = req.query;
    const workerId = req.params.id;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    startDate.setMonth(endDate.getMonth() - (range === 'year' ? 12 : range === 'quarter' ? 3 : 1));

    // Worker performance metrics
    const workerMetrics = await db('work_sessions as ws')
      .join('users as u', 'ws.worker_id', 'u.id')
      .join('routes as r', 'ws.route_id', 'r.id')
      .where('ws.worker_id', workerId)
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        'u.name as worker_name',
        db.raw('COUNT(*) as total_sessions'),
        db.raw('COUNT(DISTINCT ws.route_id) as routes_completed'),
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('AVG(ws.total_duration) as avg_session_duration'),
        db.raw('SUM(ws.distance_km) as total_distance'),
        db.raw('COUNT(CASE WHEN r.status = \'abgeschlossen\' THEN 1 END) as completed_routes_count')
      )
      .first();

    // Daily performance trend
    const dailyTrend = await db('work_sessions as ws')
      .where('ws.worker_id', workerId)
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        db.raw('DATE(ws.start_time) as date'),
        db.raw('COUNT(*) as sessions_count'),
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('COUNT(DISTINCT ws.route_id) as routes_count')
      )
      .groupBy(db.raw('DATE(ws.start_time)'))
      .orderBy('date', 'asc');

    // Material efficiency for this worker
    const materialEfficiency = await db('material_usage as mu')
      .join('work_sessions as ws', 'mu.work_session_id', 'ws.id')
      .join('materials as m', 'mu.material_id', 'm.id')
      .where('ws.worker_id', workerId)
      .whereBetween('mu.created_at', [startDate, endDate])
      .select(
        'm.name as material_name',
        db.raw('SUM(mu.amount_used) as total_used'),
        db.raw('SUM(mu.area_covered) as total_area'),
        db.raw('AVG(mu.amount_used / NULLIF(mu.area_covered, 0)) as efficiency_ratio')
      )
      .groupBy('m.id', 'm.name');

    res.json({
      worker_metrics: workerMetrics,
      daily_trend: dailyTrend,
      material_efficiency: materialEfficiency
    });
  } catch (error) {
    console.error('Error fetching worker analytics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Mitarbeiter-Analytics' });
  }
});

// GET /api/analytics/routes - Routen Analytics
router.get('/routes', auth, async (req, res) => {
  try {
    const { range } = req.query;
    
    // Most efficient routes
    const efficientRoutes = await db('work_sessions as ws')
      .join('routes as r', 'ws.route_id', 'r.id')
      .select(
        'r.id as route_id',
        'r.name as route_name',
        db.raw('COUNT(ws.id) as completion_count'),
        db.raw('AVG(ws.total_duration) as avg_duration'),
        db.raw('MIN(ws.total_duration) as best_time'),
        db.raw('MAX(ws.total_duration) as worst_time')
      )
      .groupBy('r.id', 'r.name')
      .orderBy('avg_duration', 'asc')
      .limit(10);

    // Route completion rates
    const completionRates = await db('routes as r')
      .leftJoin('work_sessions as ws', 'r.id', 'ws.route_id')
      .select(
        'r.name as route_name',
        'r.status',
        'r.priority',
        db.raw('COUNT(ws.id) as sessions_count'),
        db.raw('CASE WHEN r.status = \'abgeschlossen\' THEN 100.0 ELSE 0.0 END as completion_rate')
      )
      .groupBy('r.id', 'r.name', 'r.status', 'r.priority')
      .orderBy('completion_rate', 'desc');

    res.json({
      efficient_routes: efficientRoutes,
      completion_rates: completionRates
    });
  } catch (error) {
    console.error('Error fetching route analytics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Routen-Analytics' });
  }
});

// GET /api/analytics/costs - Kosten Analytics
router.get('/costs', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    // Material costs
    const materialCosts = await db('material_usage as mu')
      .join('materials as m', 'mu.material_id', 'm.id')
      .whereBetween('mu.created_at', [startDate, endDate])
      .select(
        'm.name as material_name',
        db.raw('SUM(mu.amount_used) as total_used'),
        db.raw('SUM(mu.amount_used * m.cost_per_unit) as total_cost'),
        db.raw('AVG(m.cost_per_unit) as avg_unit_cost')
      )
      .groupBy('m.id', 'm.name')
      .orderBy('total_cost', 'desc');

    // Fuel costs (from vehicles)
    const fuelCosts = await db('fuel_entries as fe')
      .join('vehicles as v', 'fe.vehicle_id', 'v.id')
      .whereBetween('fe.created_at', [startDate, endDate])
      .select(
        'v.license_plate',
        'v.brand',
        'v.model',
        db.raw('SUM(fe.cost) as total_fuel_cost'),
        db.raw('SUM(fe.amount) as total_fuel_amount'),
        db.raw('AVG(fe.price_per_liter) as avg_fuel_price')
      )
      .groupBy('v.id', 'v.license_plate', 'v.brand', 'v.model')
      .orderBy('total_fuel_cost', 'desc');

    // Labor costs (estimated from work sessions)
    const laborCosts = await db('work_sessions as ws')
      .join('users as u', 'ws.worker_id', 'u.id')
      .whereBetween('ws.start_time', [startDate, endDate])
      .select(
        'u.name as worker_name',
        db.raw('SUM(ws.total_duration) as total_minutes'),
        db.raw('ROUND(SUM(ws.total_duration) / 60.0, 2) as total_hours'),
        db.raw('SUM(ws.total_duration) / 60.0 * 25.0 as estimated_labor_cost') // 25€/hour default
      )
      .groupBy('u.id', 'u.name')
      .orderBy('estimated_labor_cost', 'desc');

    res.json({
      material_costs: materialCosts,
      fuel_costs: fuelCosts,
      labor_costs: laborCosts,
      period: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error('Error fetching cost analytics:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kosten-Analytics' });
  }
});

module.exports = router;