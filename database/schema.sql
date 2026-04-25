-- ============================================================
-- ML-Based Disk I/O Performance Analysis - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS disk_io_db;
USE disk_io_db;

-- OS-level disk I/O metrics (from iostat / /proc)
CREATE TABLE IF NOT EXISTS os_metrics (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    collected_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device        VARCHAR(50) NOT NULL,           -- e.g. sda, nvme0n1
    read_iops     FLOAT NOT NULL,
    write_iops    FLOAT NOT NULL,
    read_kbps     FLOAT NOT NULL,
    write_kbps    FLOAT NOT NULL,
    await_ms      FLOAT NOT NULL,                 -- avg wait time (ms)
    svctm_ms      FLOAT NOT NULL,                 -- avg service time (ms)
    util_percent  FLOAT NOT NULL,                 -- % utilization
    iowait_percent FLOAT NOT NULL,                -- CPU iowait %
    queue_depth   FLOAT NOT NULL,                 -- avg I/O queue depth
    INDEX idx_device (device),
    INDEX idx_collected_at (collected_at)
);

-- DBMS-level metrics (PostgreSQL / MySQL internal stats)
CREATE TABLE IF NOT EXISTS dbms_metrics (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    collected_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    db_name             VARCHAR(100),
    buffer_hit_rate     FLOAT,       -- %
    checkpoint_writes   INT,
    wal_bytes_per_sec   FLOAT,
    deadlocks           INT,
    temp_reads          INT,
    index_scan_ratio    FLOAT,
    rows_fetched        BIGINT,
    rows_inserted       BIGINT,
    rows_updated        BIGINT,
    rows_deleted        BIGINT,
    INDEX idx_collected_at (collected_at)
);

-- ML model predictions
CREATE TABLE IF NOT EXISTS predictions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    predicted_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device          VARCHAR(50),
    model_name      VARCHAR(100),
    predicted_iops  FLOAT,
    predicted_latency_ms FLOAT,
    confidence      FLOAT,          -- 0-1
    horizon_minutes INT,            -- how far ahead predicted
    INDEX idx_predicted_at (predicted_at)
);

-- Anomaly detection results
CREATE TABLE IF NOT EXISTS anomalies (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    detected_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device          VARCHAR(50),
    anomaly_type    ENUM('spike','bottleneck','pattern','forecast') NOT NULL,
    metric_name     VARCHAR(100),
    metric_value    FLOAT,
    severity        ENUM('low','medium','high','critical') NOT NULL,
    model_used      VARCHAR(100),
    anomaly_score   FLOAT,          -- isolation forest / autoencoder score
    resolved        BOOLEAN DEFAULT FALSE,
    INDEX idx_detected_at (detected_at),
    INDEX idx_severity (severity)
);

-- Algorithm benchmark results (for comparison page)
CREATE TABLE IF NOT EXISTS algorithm_benchmarks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    run_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    algo_name   VARCHAR(100) NOT NULL,
    precision_score FLOAT,
    recall_score    FLOAT,
    f1_score        FLOAT,
    train_time_sec  FLOAT,
    predict_time_ms FLOAT,
    dataset_rows    INT
);
