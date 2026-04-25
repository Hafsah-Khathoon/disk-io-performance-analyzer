# Disk I/O ML Monitoring Project

A full-stack observability platform for disk I/O and database workload monitoring. This project collects live disk and CPU metrics from a Windows machine, stores them in MySQL, detects anomalies, and provides short-term IOPS prediction through a Python ML microservice.

## Project Overview

The project is designed to make disk performance monitoring machine-aware and report-ready by combining: 
- live operating system metrics, 
- DBMS performance indicators, 
- threshold-based anomaly detection, 
- machine learning prediction service,
- and a React dashboard for visualization.

It is ideal for reports showing system health, performance trends, anomaly events, and ML-driven forecasting in a single integrated solution.

## Key Features

- Live data collection from the local machine every 5 seconds
- Real-time WebSocket streaming to the frontend dashboard
- Threshold-based anomaly detection for disk bottlenecks and spikes
- MySQL-backed persistence for metrics, anomalies, and predictions
- Python ML microservice for IOPS forecasting and anomaly detection
- Six dashboard views: Dashboard, OS Metrics, DBMS, Predictions, Anomalies, Algorithms
- Auto-refreshing charts and KPI cards with live updates
- Simple start command via `start-all.bat`

## Feature Details

- **Live OS Metrics**: Collects disk read/write IOPS, throughput, latency, CPU utilization, I/O wait, and queue depth from the host machine.
- **DBMS Metrics**: Reads MySQL `INNODB` status counters and computes buffer pool hit rate, checkpoint writes, WAL throughput, row operations, and index scan ratio.
- **Anomaly Detection**: Uses configurable thresholds to classify events into `high` and `critical` severity levels and logs anomalies in the database.
- **Prediction Service**: Provides a Flask API to predict future IOPS and latency using pre-trained Random Forest models and feature engineering.
- **Dashboard Views**: Displays live KPIs, historical charts, prediction results, anomaly logs, and algorithm comparisons in a single React app.
- **Data Storage**: Persists metrics and anomaly records in MySQL to support reporting and trend analysis.

## Architecture and Component Breakdown

### Frontend
- `frontend/src/App.js`: React app with navigation tabs for the dashboard.
- Uses React Router for routing and Recharts for charts.
- Connects to backend REST APIs and listens for WebSocket live updates.

### Backend
- `backend/server.js`: Express server that collects metrics and broadcasts them over WebSockets.
- Uses `systeminformation` for live hardware metrics and `mysql2` for database storage.
- Collects OS metrics every 5 seconds and DBMS metrics every 30 seconds.
- Stores data via `backend/models/metricsModel.js` and exposes REST routes in `backend/routes/metrics.js`.

### ML Service
- `ml-model/predict.py`: Flask microservice serving prediction and anomaly detection.
- Endpoints:
  - `GET /health` — service health check
  - `POST /predict` — IOPS forecast based on recent history
  - `POST /detect` — anomaly detection for a batch of records
  - `GET /feature-importance` — top model features
- Uses a pickled model bundle created by `ml-model/train_model.py`.

### Database
- MySQL stores:
  - OS metrics
  - DBMS metrics
  - anomaly records
  - prediction results
- Schema files are in `database/schema.sql` and sample data is in `database/sample_data.sql`.

## Data Flow

1. Backend reads live OS metrics and MySQL DBMS metrics.
2. Metrics are inserted into the database.
3. Every 5 seconds, the backend broadcasts live data and anomalies to connected frontend clients.
4. Frontend updates dashboards and charts in real time.
5. The ML service receives recent history and returns IOPS predictions and anomaly status.

## Technical Stack

### Root
- `concurrently` to start all services together via `start-all.bat`

### Frontend
- React.js
- React Router
- Axios
- Recharts

### Backend
- Node.js + Express
- WebSocket (`ws`)
- systeminformation
- MySQL (`mysql2`)
- dotenv
- cors

### Database
- MySQL 8.0

### ML Service
- Python 3.x
- Flask
- pandas, numpy
- scikit-learn
- XGBoost
- pickle

## Installation

### Prerequisites
- Node.js 14+
- Python 3.8+
- MySQL 8.0

### Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/sample_data.sql
```

### Backend Setup
1. Create `backend/.env`
2. Add MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=disk_io_db
```

### ML Setup
```bash
cd ml-model
pip install -r requirements.txt
python train_model.py
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Run the System

From the project root:
```bash
.\start-all.bat
```

This starts:
- Backend API on `http://localhost:5000`
- ML Service on `http://localhost:5001`
- Frontend on `http://localhost:3000`

## Deployment Details

The project is also deployed to cloud hosting for production-style access:

- Frontend deployed on Vercel: `https://disk-io-performance-analyzer.vercel.app`
- Backend service deployed on Render: `https://disk-io-performance-analyzer.onrender.com`
- MySQL database hosted on Railway

### Deployment architecture

- The React frontend is served from Vercel and communicates with the backend via HTTPS.
- The backend API runs on Render and connects to the Railway MySQL database.
- The Railway database stores live metrics, anomaly records, and prediction results.

> Note: Live local OS metric collection requires the backend to run on a Windows host with the `systeminformation` library, so deployed services may use simulated or proxy metric data for dashboards.

## Report-Friendly Notes

- The backend collects OS-level and DBMS-level metrics on a rolling basis and persists them for reporting.
- Anomalies are detected using fixed thresholds and stored with severity labels.
- The ML service can generate predictions and explain top predictors through feature importance.
- The React UI shows real-time data alongside historical summaries for easy dashboard reporting.

## Useful Metrics for Report Sections

- **Performance Metrics**: Read/Write IOPS, read/write throughput, await latency, service time, utilization, I/O wait.
- **DBMS Metrics**: InnoDB buffer pool hit rate, checkpoint writes, WAL throughput, row operations.
- **Anomaly Metrics**: Severity, metric name, anomaly score, model used.
- **Prediction Metrics**: Forecasted IOPS, predicted latency, confidence.

## Notes

- If `ml-model/model.pkl` is missing, run `python train_model.py` first.
- The backend simulates missing disk metrics for compatibility if live hardware data is not available.

## Contact

For project questions or report clarifications, inspect:
- `backend/server.js`
- `frontend/src/App.js`
- `ml-model/predict.py`
- `database/schema.sql`

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
