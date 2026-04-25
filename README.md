# ML-Based Disk I/O Performance Analyzer

A full-stack intelligent monitoring system that collects **real-time disk I/O metrics from your PC**, detects anomalies using Machine Learning, and predicts future performance using Random Forest.

---

## Features

- Live disk I/O metrics collected directly from your PC every 5 seconds
- Real-time WebSocket push to frontend (no manual refresh needed)
- Automatic anomaly detection with severity levels (Low / High / Critical)
- ML-powered IOPS prediction (Random Forest, 85–97% confidence)
- Interactive dashboard with 6 views: Dashboard, OS Metrics, DBMS, Predictions, Anomalies, Algorithms
- Algorithm comparison: Isolation Forest, Random Forest, XGBoost, LSTM, Autoencoder
- Single command to start everything

---

## Technical Stack

### Frontend
| Technology     | Purpose                        |
|----------------|-------------------------------|
| React.js 18    | UI framework                  |
| Recharts       | Charts and data visualization |
| React Router 6 | Client-side navigation        |
| Axios          | HTTP API calls                |
| WebSocket API  | Real-time live data updates   |
| Poppins / Inter| Typography                    |

### Backend
| Technology          | Purpose                          |
|---------------------|----------------------------------|
| Node.js + Express   | REST API server                  |
| ws (WebSocket)      | Push live data to frontend       |
| systeminformation   | Read real PC disk/CPU metrics    |
| mysql2              | MySQL database driver            |
| dotenv              | Environment configuration        |
| nodemon             | Auto-restart on file changes     |

### Database
| Technology | Purpose                        |
|------------|-------------------------------|
| MySQL 8.0  | Store metrics, anomalies, predictions |

### ML Service
| Technology    | Purpose                          |
|---------------|----------------------------------|
| Python 3.x    | ML runtime                       |
| Flask         | ML microservice API              |
| scikit-learn  | Isolation Forest, Random Forest  |
| XGBoost       | Bottleneck classification        |
| Pandas/NumPy  | Data processing                  |
| joblib        | Model serialization              |

---

## System Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR PC (Windows)                        │
│                                                                 │
│   CPU Load ──┐                                                  │
│   Disk I/O ──┼──► systeminformation (Node.js library)          │
│   Memory   ──┘         │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │ every 5 seconds
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js :5000)                       │
│                                                                 │
│  1. Collect live metrics from PC                                │
│  2. Run Threshold Anomaly Detection                             │
│       util > 90%  → CRITICAL                                    │
│       util > 70%  → HIGH                                        │
│       await > 15ms → CRITICAL                                   │
│  3. Save metrics + anomalies → MySQL                            │
│  4. Broadcast via WebSocket → Frontend                          │
│                                                                 │
│  REST API Endpoints:                                            │
│  GET  /api/metrics/os          ← OS metrics history            │
│  GET  /api/metrics/anomalies   ← Detected anomalies            │
│  GET  /api/metrics/summary     ← Dashboard KPIs                │
│  POST /api/metrics/predict     ← Trigger ML prediction         │
└──────────────┬──────────────────────────┬───────────────────────┘
               │ WebSocket (ws://)        │ HTTP POST
               │ push every 5s           │ on demand
               ▼                         ▼
┌──────────────────────────┐   ┌─────────────────────────────────┐
│   FRONTEND (React :3000) │   │   ML SERVICE (Python :5001)     │
│                          │   │                                 │
│  Dashboard               │   │  POST /predict                  │
│  ├─ KPI Cards            │   │  └─ Random Forest IOPS forecast │
│  ├─ IOPS Chart (live)    │   │                                 │
│  ├─ Latency Chart (live) │   │  POST /detect                   │
│  OS Metrics              │   │  └─ Isolation Forest anomaly    │
│  DBMS Stats              │   │                                 │
│  Predictions             │   │  GET /feature-importance        │
│  Anomalies (live)        │   │  └─ Top 10 feature weights      │
│  Algorithm Comparison    │   │                                 │
└──────────────────────────┘   └─────────────────────────────────┘
               │                         │
               └────────────┬────────────┘
                            ▼
               ┌─────────────────────────┐
               │   MySQL Database        │
               │                         │
               │  os_metrics             │
               │  dbms_metrics           │
               │  predictions            │
               │  anomalies              │
               │  algorithm_benchmarks   │
               └─────────────────────────┘
```

---

## Installation

### Prerequisites
- Node.js 14+
- Python 3.8+
- MySQL 8.0

### Step 1: Setup Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```

### Step 2: Configure Environment
Edit `backend/.env`:
```
DB_PASSWORD=your_mysql_password
```

### Step 3: Train ML Model
```bash
cd ml-model
pip install -r requirements.txt
python train_model.py
```

---

## Run (Single Command)

```bash
.\start-all.bat
```

This starts:
- Backend API on http://localhost:5000
- ML Service on http://localhost:5001
- Frontend on http://localhost:3000

---

## How Live Data Works

1. Backend uses `systeminformation` to read real CPU and disk metrics from your PC
2. Every 5 seconds, metrics are saved to MySQL and pushed via WebSocket
3. Frontend receives WebSocket messages and updates charts instantly
4. Anomaly detection runs on every data point automatically
5. No manual refresh needed — everything updates in real time

---

## Anomaly Detection Thresholds

| Metric         | Warning | Critical |
|----------------|---------|----------|
| Disk Util %    | 70%     | 90%      |
| Await (ms)     | 5ms     | 15ms     |
| IOWait %       | 20%     | 40%      |
| Queue Depth    | 8       | 20       |
| Read IOPS      | 2000    | 3500     |
| Write IOPS     | 1500    | 2500     |

---

## ML Model Performance

| Algorithm        | Precision | Recall | F1    |
|------------------|-----------|--------|-------|
| Isolation Forest | 94%       | 89%    | 91%   |
| LSTM             | 91%       | 93%    | 92%   |
| Random Forest    | 88%       | 86%    | 87%   |
| XGBoost          | 93%       | 90%    | 91%   |
| Autoencoder      | 87%       | 92%    | 89%   |

---

## Screenshots

> Dashboard — Live KPI cards and real-time IOPS charts

> Anomalies — Severity-coded anomaly log with model attribution

> Predictions — ML-powered IOPS forecast with confidence score

> Algorithms — Side-by-side ML model comparison

---

## Project Structure

```
disk-io-ml-project/
├── backend/                  ← Node.js Express API + WebSocket
│   ├── config/db.js          ← MySQL connection pool
│   ├── controllers/          ← Route handlers
│   ├── models/               ← Database queries
│   ├── routes/               ← API route definitions
│   ├── server.js             ← Main server + live collector
│   └── .env                  ← Environment variables
├── frontend/                 ← React dashboard
│   └── src/
│       ├── components/       ← Dashboard, Charts, Tables, PredictionCard
│       └── pages/Home.js     ← Main page with WebSocket integration
├── ml-model/                 ← Python Flask ML service
│   ├── train_model.py        ← Train Isolation Forest + Random Forest
│   └── predict.py            ← Flask API for predictions
├── database/
│   ├── schema.sql            ← Table definitions
│   └── sample_data.sql       ← Sample records
├── metrics-collector/        ← Optional standalone Python collector
├── package.json              ← Root: single command runner
└── start-all.bat             ← Windows one-click startup
```
