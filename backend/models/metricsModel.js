// backend/models/metricsModel.js
const db = require("../config/db");

const MetricsModel = {
  // ── OS Metrics ─────────────────────────────────────────────────────────────
  async getOSMetrics({ device, limit = 60 }) {
    const [rows] = await db.query(
      `SELECT * FROM os_metrics
       WHERE device = ?
       ORDER BY collected_at DESC LIMIT ?`,
      [device, limit]
    );
    return rows.reverse();
  },

  async getLatestOSMetrics() {
    const [rows] = await db.query(
      `SELECT m.*
       FROM os_metrics m
       INNER JOIN (
         SELECT device, MAX(collected_at) AS max_time
         FROM os_metrics GROUP BY device
       ) latest ON m.device = latest.device AND m.collected_at = latest.max_time`
    );
    return rows;
  },

  async insertOSMetric(data) {
    const {
      device, read_iops, write_iops, read_kbps, write_kbps,
      await_ms, svctm_ms, util_percent, iowait_percent, queue_depth
    } = data;
    const [result] = await db.query(
      `INSERT INTO os_metrics
       (device,read_iops,write_iops,read_kbps,write_kbps,await_ms,svctm_ms,util_percent,iowait_percent,queue_depth)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [device, read_iops, write_iops, read_kbps, write_kbps,
       await_ms, svctm_ms, util_percent, iowait_percent, queue_depth]
    );
    return result.insertId;
  },

  // ── DBMS Metrics ───────────────────────────────────────────────────────────
  async getDBMSMetrics({ limit = 20 }) {
    const [rows] = await db.query(
      `SELECT * FROM dbms_metrics ORDER BY collected_at DESC LIMIT ?`,
      [limit]
    );
    return rows.reverse();
  },

  async getLatestDBMSMetrics() {
    const [rows] = await db.query(
      `SELECT * FROM dbms_metrics ORDER BY collected_at DESC LIMIT 1`
    );
    return rows[0] || null;
  },

  async insertDBMSMetric(data) {
    const {
      db_name, buffer_hit_rate, checkpoint_writes, wal_bytes_per_sec,
      deadlocks, temp_reads, index_scan_ratio, rows_fetched,
      rows_inserted, rows_updated, rows_deleted
    } = data;
    const [result] = await db.query(
      `INSERT INTO dbms_metrics
       (db_name,buffer_hit_rate,checkpoint_writes,wal_bytes_per_sec,deadlocks,temp_reads,index_scan_ratio,rows_fetched,rows_inserted,rows_updated,rows_deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [db_name, buffer_hit_rate, checkpoint_writes, wal_bytes_per_sec,
       deadlocks, temp_reads, index_scan_ratio, rows_fetched,
       rows_inserted, rows_updated, rows_deleted]
    );
    return result.insertId;
  },

  // ── Predictions ────────────────────────────────────────────────────────────
  async getPredictions({ device, limit = 30 }) {
    const [rows] = await db.query(
      `SELECT * FROM predictions WHERE device = ?
       ORDER BY predicted_at DESC LIMIT ?`,
      [device, limit]
    );
    return rows.reverse();
  },

  async insertPrediction(data) {
    const { device, model_name, predicted_iops, predicted_latency_ms, confidence, horizon_minutes } = data;
    const [result] = await db.query(
      `INSERT INTO predictions (device,model_name,predicted_iops,predicted_latency_ms,confidence,horizon_minutes)
       VALUES (?,?,?,?,?,?)`,
      [device, model_name, predicted_iops, predicted_latency_ms, confidence, horizon_minutes]
    );
    return result.insertId;
  },

  // ── Anomalies ──────────────────────────────────────────────────────────────
  async getAnomalies({ severity, limit = 50 }) {
    let q = `SELECT * FROM anomalies`;
    const params = [];
    if (severity) { q += ` WHERE severity = ?`; params.push(severity); }
    q += ` ORDER BY detected_at DESC LIMIT ?`;
    params.push(limit);
    const [rows] = await db.query(q, params);
    return rows;
  },

  async insertAnomaly(data) {
    const { device, anomaly_type, metric_name, metric_value, severity, model_used, anomaly_score } = data;
    const [result] = await db.query(
      `INSERT INTO anomalies (device,anomaly_type,metric_name,metric_value,severity,model_used,anomaly_score)
       VALUES (?,?,?,?,?,?,?)`,
      [device, anomaly_type, metric_name, metric_value, severity, model_used, anomaly_score]
    );
    return result.insertId;
  },

  // ── Algorithm Benchmarks ───────────────────────────────────────────────────
  async getBenchmarks() {
    const [rows] = await db.query(
      `SELECT * FROM algorithm_benchmarks ORDER BY f1_score DESC`
    );
    return rows;
  },

  // ── Summary Stats ──────────────────────────────────────────────────────────
  async getSummaryStats() {
    const [[osRow]] = await db.query(
      `SELECT COUNT(*) AS total, AVG(util_percent) AS avg_util,
              MAX(util_percent) AS max_util, AVG(await_ms) AS avg_await
       FROM os_metrics WHERE collected_at >= NOW() - INTERVAL 1 HOUR`
    );
    const [[anomRow]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(severity='critical') AS critical_count,
              SUM(severity='high') AS high_count
       FROM anomalies WHERE detected_at >= NOW() - INTERVAL 24 HOUR`
    );
    return { osRow, anomRow };
  },
};

module.exports = MetricsModel;
