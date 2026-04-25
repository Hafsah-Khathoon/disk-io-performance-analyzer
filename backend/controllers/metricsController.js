// backend/controllers/metricsController.js
const MetricsModel = require("../models/metricsModel");
const axios        = require("axios");

const ML_API = process.env.ML_API_URL || "http://localhost:5001";

// ── GET /api/metrics/os?device=sda&limit=60 ───────────────────────────────────
exports.getOSMetrics = async (req, res) => {
  try {
    const { device = "sda", limit = 60 } = req.query;
    const data = await MetricsModel.getOSMetrics({ device, limit: parseInt(limit) });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/metrics/os/latest ───────────────────────────────────────────────
exports.getLatestOSMetrics = async (req, res) => {
  try {
    const data = await MetricsModel.getLatestOSMetrics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/metrics/os ─────────────────────────────────────────────────────
exports.insertOSMetric = async (req, res) => {
  try {
    const id = await MetricsModel.insertOSMetric(req.body);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/metrics/dbms?limit=20 ───────────────────────────────────────────
exports.getDBMSMetrics = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const data = await MetricsModel.getDBMSMetrics({ limit: parseInt(limit) });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/metrics/dbms/latest ─────────────────────────────────────────────
exports.getLatestDBMSMetrics = async (req, res) => {
  try {
    const data = await MetricsModel.getLatestDBMSMetrics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/metrics/dbms ───────────────────────────────────────────────────
exports.insertDBMSMetric = async (req, res) => {
  try {
    const id = await MetricsModel.insertDBMSMetric(req.body);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/metrics/predictions?device=sda ──────────────────────────────────
exports.getPredictions = async (req, res) => {
  try {
    const { device = "sda", limit = 30 } = req.query;
    const data = await MetricsModel.getPredictions({ device, limit: parseInt(limit) });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/metrics/predict ────────────────────────────────────────────────
exports.runPrediction = async (req, res) => {
  const { device = "sda", horizon_minutes = 10 } = req.body;
  try {
    const history = await MetricsModel.getOSMetrics({ device, limit: 60 });

    // Try ML microservice first (only works locally)
    try {
      const mlRes = await axios.post(`${ML_API}/predict`, { device, horizon_minutes, history },
        { timeout: 3000 });
      const prediction = mlRes.data;
      const id = await MetricsModel.insertPrediction({
        device, model_name: prediction.model_name,
        predicted_iops: prediction.predicted_iops,
        predicted_latency_ms: prediction.predicted_latency_ms,
        confidence: prediction.confidence, horizon_minutes,
      });
      return res.json({ success: true, id, ...prediction, fallback: false, ml_service_online: true });
    } catch (_) {
      // ML service offline — use built-in prediction
    }

    // Built-in prediction using recent data averages + trend
    const recent = history.slice(-10);
    const avgReadIops  = recent.reduce((s, r) => s + (r.read_iops  || 0), 0) / Math.max(recent.length, 1);
    const avgWriteIops = recent.reduce((s, r) => s + (r.write_iops || 0), 0) / Math.max(recent.length, 1);
    const avgAwait     = recent.reduce((s, r) => s + (r.await_ms   || 0), 0) / Math.max(recent.length, 1);

    // Simple trend: compare last 5 vs first 5
    const first5 = recent.slice(0, 5);
    const last5  = recent.slice(-5);
    const trend  = last5.reduce((s, r) => s + r.read_iops, 0) / 5 -
                   first5.reduce((s, r) => s + r.read_iops, 0) / 5;

    const predicted_iops    = parseFloat(Math.max(0, avgReadIops + trend * (horizon_minutes / 5)).toFixed(1));
    const predicted_latency = parseFloat((avgAwait * (1 + 0.03 * horizon_minutes)).toFixed(2));
    const confidence        = parseFloat(Math.max(0.70, Math.min(0.95, 0.92 - 0.008 * horizon_minutes)).toFixed(3));

    const id = await MetricsModel.insertPrediction({
      device, model_name: "BuiltInPredictor",
      predicted_iops, predicted_latency_ms: predicted_latency,
      confidence, horizon_minutes,
    });

    return res.json({
      success: true, id,
      device, model_name: "BuiltInPredictor",
      horizon_minutes, predicted_iops,
      predicted_latency_ms: predicted_latency,
      confidence,
      fallback: true,
      ml_service_online: false,
      message: "ML service offline — using built-in predictor",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// ── GET /api/metrics/anomalies?severity=critical&limit=50 ────────────────────
exports.getAnomalies = async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;
    const data = await MetricsModel.getAnomalies({ severity, limit: parseInt(limit) });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/metrics/detect-anomaly ─────────────────────────────────────────
exports.detectAnomaly = async (req, res) => {
  try {
    const { device = "sda" } = req.body;
    const history = await MetricsModel.getOSMetrics({ device, limit: 100 });

    const mlRes = await axios.post(`${ML_API}/detect`, { device, history });
    const { anomalies } = mlRes.data;

    const insertedIds = [];
    for (const a of anomalies) {
      const id = await MetricsModel.insertAnomaly({ ...a, device });
      insertedIds.push(id);
    }

    res.json({ success: true, detected: anomalies.length, ids: insertedIds, anomalies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/metrics/benchmarks ──────────────────────────────────────────────
exports.getBenchmarks = async (req, res) => {
  try {
    const data = await MetricsModel.getBenchmarks();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/metrics/summary ─────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const { osRow, anomRow } = await MetricsModel.getSummaryStats();
    res.json({
      success: true,
      data: {
        total_samples:    osRow.total,
        avg_utilization:  parseFloat((osRow.avg_util || 0).toFixed(1)),
        max_utilization:  parseFloat((osRow.max_util || 0).toFixed(1)),
        avg_await_ms:     parseFloat((osRow.avg_await || 0).toFixed(2)),
        total_anomalies:  anomRow.total,
        critical_anomalies: anomRow.critical_count,
        high_anomalies:     anomRow.high_count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
