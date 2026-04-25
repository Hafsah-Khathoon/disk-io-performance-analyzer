-- ============================================================
-- Sample Data for disk_io_db
-- ============================================================
USE disk_io_db;

-- OS metrics samples (last 30 minutes, every minute)
INSERT INTO os_metrics (collected_at, device, read_iops, write_iops, read_kbps, write_kbps, await_ms, svctm_ms, util_percent, iowait_percent, queue_depth) VALUES
(NOW() - INTERVAL 30 MINUTE, 'sda', 1250, 830,  340, 195, 2.1, 1.2, 62, 18, 4.2),
(NOW() - INTERVAL 29 MINUTE, 'sda', 1310, 790,  355, 180, 2.4, 1.3, 65, 20, 4.8),
(NOW() - INTERVAL 28 MINUTE, 'sda', 1180, 870,  320, 210, 1.9, 1.1, 59, 16, 3.9),
(NOW() - INTERVAL 27 MINUTE, 'sda', 2980, 1200, 620, 390, 8.2, 3.1, 94, 42, 18.3),  -- anomaly
(NOW() - INTERVAL 26 MINUTE, 'sda', 1350, 820,  365, 200, 2.3, 1.2, 64, 19, 5.1),
(NOW() - INTERVAL 25 MINUTE, 'sda', 1290, 860,  345, 205, 2.2, 1.2, 63, 18, 4.5),
(NOW() - INTERVAL 24 MINUTE, 'sda', 1400, 910,  380, 220, 2.6, 1.4, 68, 22, 5.8),
(NOW() - INTERVAL 23 MINUTE, 'sda', 1230, 800,  330, 190, 2.0, 1.1, 61, 17, 4.1),
(NOW() - INTERVAL 22 MINUTE, 'sda', 1160, 780,  310, 185, 1.8, 1.0, 58, 15, 3.7),
(NOW() - INTERVAL 21 MINUTE, 'sda', 1320, 840,  355, 202, 2.3, 1.3, 65, 20, 4.9),
(NOW() - INTERVAL 20 MINUTE, 'nvme0n1', 4200, 2100, 1800, 950, 0.4, 0.2, 55, 10, 2.1),
(NOW() - INTERVAL 19 MINUTE, 'nvme0n1', 4350, 2200, 1850, 980, 0.5, 0.2, 58, 11, 2.4),
(NOW() - INTERVAL 18 MINUTE, 'nvme0n1', 4100, 2050, 1760, 920, 0.4, 0.2, 54, 10, 2.0),
(NOW() - INTERVAL 17 MINUTE, 'nvme0n1', 8900, 3200, 3200, 1400, 1.8, 0.8, 89, 35, 12.6), -- anomaly
(NOW() - INTERVAL 16 MINUTE, 'nvme0n1', 4280, 2130, 1830, 960, 0.5, 0.2, 56, 10, 2.2),
(NOW() - INTERVAL 15 MINUTE, 'nvme0n1', 4190, 2090, 1790, 940, 0.4, 0.2, 55, 10, 2.1),
(NOW() - INTERVAL 14 MINUTE, 'nvme0n1', 4310, 2150, 1840, 970, 0.5, 0.2, 57, 11, 2.3),
(NOW() - INTERVAL 13 MINUTE, 'nvme0n1', 4050, 2020, 1740, 910, 0.4, 0.2, 53, 9,  2.0),
(NOW() - INTERVAL 12 MINUTE, 'nvme0n1', 4400, 2200, 1880, 990, 0.5, 0.2, 59, 11, 2.5),
(NOW() - INTERVAL 11 MINUTE, 'nvme0n1', 4230, 2110, 1810, 950, 0.4, 0.2, 56, 10, 2.2),
(NOW() - INTERVAL 10 MINUTE, 'sda', 1270, 810, 340, 192, 2.1, 1.1, 62, 18, 4.3),
(NOW() - INTERVAL 9  MINUTE, 'sda', 1300, 850, 350, 200, 2.2, 1.2, 63, 19, 4.6),
(NOW() - INTERVAL 8  MINUTE, 'sda', 1240, 820, 333, 195, 2.0, 1.1, 61, 17, 4.2),
(NOW() - INTERVAL 7  MINUTE, 'sda', 1380, 890, 370, 212, 2.5, 1.3, 66, 21, 5.3),
(NOW() - INTERVAL 6  MINUTE, 'sda', 1210, 800, 325, 188, 1.9, 1.0, 60, 16, 4.0),
(NOW() - INTERVAL 5  MINUTE, 'sda', 1330, 845, 358, 202, 2.3, 1.2, 64, 19, 4.8),
(NOW() - INTERVAL 4  MINUTE, 'sda', 1290, 830, 347, 198, 2.2, 1.2, 63, 18, 4.5),
(NOW() - INTERVAL 3  MINUTE, 'sda', 1360, 870, 365, 207, 2.4, 1.3, 65, 20, 5.0),
(NOW() - INTERVAL 2  MINUTE, 'sda', 1200, 790, 322, 187, 1.9, 1.0, 60, 16, 4.0),
(NOW() - INTERVAL 1  MINUTE, 'sda', 1280, 820, 342, 195, 2.1, 1.1, 62, 18, 4.3);

-- DBMS metrics samples
INSERT INTO dbms_metrics (collected_at, db_name, buffer_hit_rate, checkpoint_writes, wal_bytes_per_sec, deadlocks, temp_reads, index_scan_ratio, rows_fetched, rows_inserted, rows_updated, rows_deleted) VALUES
(NOW() - INTERVAL 30 MINUTE, 'disk_io_db', 98.2, 1240, 4.2, 0, 23, 91.4, 450000, 12000, 3400, 800),
(NOW() - INTERVAL 20 MINUTE, 'disk_io_db', 97.9, 1290, 4.5, 0, 28, 90.8, 460000, 12500, 3600, 820),
(NOW() - INTERVAL 10 MINUTE, 'disk_io_db', 98.4, 1210, 4.1, 0, 20, 92.1, 445000, 11800, 3300, 790),
(NOW() - INTERVAL 5  MINUTE, 'disk_io_db', 98.1, 1260, 4.3, 0, 25, 91.7, 455000, 12200, 3500, 810),
(NOW() - INTERVAL 1  MINUTE, 'disk_io_db', 98.3, 1235, 4.2, 0, 22, 91.9, 451000, 12100, 3420, 800);

-- Anomaly records
INSERT INTO anomalies (detected_at, device, anomaly_type, metric_name, metric_value, severity, model_used, anomaly_score) VALUES
(NOW() - INTERVAL 27 MINUTE, 'sda',      'spike',      'write_latency',   22.3,  'high',     'IsolationForest', 0.87),
(NOW() - INTERVAL 17 MINUTE, 'nvme0n1',  'bottleneck', 'util_percent',    89.0,  'critical', 'IsolationForest', 0.94),
(NOW() - INTERVAL 45 MINUTE, 'sda',      'pattern',    'iops_oscillation',800.0, 'medium',   'LSTM',            0.73),
(NOW() - INTERVAL 60 MINUTE, 'sda',      'forecast',   'queue_depth',     128.0, 'low',      'XGBoost',         0.61),
(NOW() - INTERVAL 90 MINUTE, 'nvme0n1',  'spike',      'read_iops',       8900,  'medium',   'IsolationForest', 0.78);

-- Algorithm benchmarks
INSERT INTO algorithm_benchmarks (algo_name, precision_score, recall_score, f1_score, train_time_sec, predict_time_ms, dataset_rows) VALUES
('IsolationForest', 0.94, 0.89, 0.91, 12.3,  8.2,  50000),
('LSTM',            0.91, 0.93, 0.92, 45.6,  31.4, 50000),
('RandomForest',    0.88, 0.86, 0.87,  8.1,   5.6, 50000),
('XGBoost',         0.93, 0.90, 0.91, 15.2,  10.8, 50000),
('Autoencoder',     0.87, 0.92, 0.89, 67.4,  52.1, 50000);
