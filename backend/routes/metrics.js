// backend/routes/metrics.js
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/metricsController");

// OS metrics
router.get("/os",           ctrl.getOSMetrics);
router.get("/os/latest",    ctrl.getLatestOSMetrics);
router.post("/os",          ctrl.insertOSMetric);

// DBMS metrics
router.get("/dbms",         ctrl.getDBMSMetrics);
router.get("/dbms/latest",  ctrl.getLatestDBMSMetrics);
router.post("/dbms",        ctrl.insertDBMSMetric);

// Predictions
router.get("/predictions",  ctrl.getPredictions);
router.post("/predict",     ctrl.runPrediction);

// Anomaly detection
router.get("/anomalies",    ctrl.getAnomalies);
router.post("/detect-anomaly", ctrl.detectAnomaly);

// Benchmarks
router.get("/benchmarks",   ctrl.getBenchmarks);

// Summary dashboard stats
router.get("/summary",      ctrl.getSummary);

module.exports = router;
