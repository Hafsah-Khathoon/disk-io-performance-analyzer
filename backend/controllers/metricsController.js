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

// ── POST /api/metrics/predict  (call ML microservice) ────────────────────────
exports.runPrediction = async (req, res) => {
  try {
    const { device = "sda", horizon_minutes = 10 } = req.body;

    // fetch last 60 records for the device to send to ML model
    const history = await MetricsModel.getOSMetrics({ device, limit: 60 });

    // call Python ML microservice
    const mlRes = await axios.post(`${ML_API}/predict`, {
      device,
      horizon_minutes,
      history,
    });

    const prediction = mlRes.data;

    // persist prediction
    const id = await MetricsModel.insertPrediction({
      device,
      model_name:           prediction.model_name,
      predicted_iops:       prediction.predicted_iops,
      predicted_latency_ms: prediction.predicted_latency_ms,
      confidence:           prediction.confidence,
      horizon_minutes,
    });

    res.json({ success: true, id, ...prediction });
  } catch (err) {
    // if ML service down, return last stored predictions
    const data = await MetricsModel.getPredictions({ device: req.body.device || "sda", limit: 10 });
    res.json({ success: true, fallback: true, data, message: "ML service offline, showing stored predictions" });
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
