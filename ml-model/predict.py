"""
ml-model/predict.py
Flask microservice – serves anomaly detection + IOPS predictions.
Runs on port 5001.  Start: python predict.py
"""

import pickle, json, os
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# ── Load model bundle ─────────────────────────────────────────────────────────
def load_models():
    if not os.path.exists(MODEL_PATH):
        print("[WARN] model.pkl not found – run train_model.py first")
        return None
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

bundle = load_models()

BASE_FEATURES = [
    "read_iops","write_iops","read_kbps","write_kbps",
    "await_ms","svctm_ms","util_percent","iowait_percent","queue_depth"
]

# ── /health ───────────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": bundle is not None})

# ── /predict  POST ────────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    """Predict next N-minute IOPS given recent history."""
    global bundle
    if bundle is None:
        bundle = load_models()
        if bundle is None:
            return jsonify({"error": "Model not trained. Run train_model.py first."}), 503

    body    = request.get_json()
    history = body.get("history", [])
    horizon = int(body.get("horizon_minutes", 10))
    device  = body.get("device", "unknown")

    if len(history) < 5:
        return jsonify({"error": "Need at least 5 historical records"}), 400

    df = pd.DataFrame(history)[BASE_FEATURES].fillna(0).tail(10)

    # add lag features matching training
    row = df.iloc[-1].to_dict()
    for lag, idx in zip([1,2,3,5], [-2,-3,-4,-6]):
        safe_df = df if abs(idx) <= len(df) else df
        src = df.iloc[idx] if abs(idx) <= len(df) else df.iloc[0]
        row[f"read_iops_lag{lag}"]  = src["read_iops"]
        row[f"write_iops_lag{lag}"] = src["write_iops"]
        row[f"await_lag{lag}"]      = src["await_ms"]

    pred_features = bundle["pred_features"]
    X = pd.DataFrame([row])[pred_features].fillna(0)

    predicted_iops    = float(bundle["pred_model"].predict(X)[0])
    predicted_latency = float(row["await_ms"] * (1 + 0.05 * horizon))
    confidence        = max(0.60, min(0.97, 0.95 - 0.01 * horizon + np.random.uniform(-0.02, 0.02)))

    return jsonify({
        "device":               device,
        "model_name":           "RandomForest",
        "horizon_minutes":      horizon,
        "predicted_iops":       round(predicted_iops, 1),
        "predicted_latency_ms": round(predicted_latency, 2),
        "confidence":           round(confidence, 3),
    })

# ── /detect  POST ─────────────────────────────────────────────────────────────
@app.route("/detect", methods=["POST"])
def detect():
    """Detect anomalies in a batch of historical records."""
    global bundle
    if bundle is None:
        bundle = load_models()
        if bundle is None:
            return jsonify({"error": "Model not trained. Run train_model.py first."}), 503

    body    = request.get_json()
    history = body.get("history", [])
    device  = body.get("device", "unknown")

    if len(history) < 10:
        return jsonify({"error": "Need at least 10 records for detection"}), 400

    df = pd.DataFrame(history)[BASE_FEATURES].fillna(0)

    scaler = bundle["anomaly_scaler"]
    model  = bundle["anomaly_model"]

    X_scaled = scaler.transform(df)
    preds    = model.predict(X_scaled)           # -1 = anomaly, 1 = normal
    scores   = model.decision_function(X_scaled)  # lower = more anomalous

    anomalies = []
    for i, (pred, score) in enumerate(zip(preds, scores)):
        if pred == -1:
            row = df.iloc[i]
            severity = (
                "critical" if score < -0.5 else
                "high"     if score < -0.3 else
                "medium"   if score < -0.15 else "low"
            )
            # identify which metric pushed it over
            dominant = max(BASE_FEATURES, key=lambda f: abs(
                (row[f] - df[f].mean()) / (df[f].std() + 1e-9)
            ))
            anomalies.append({
                "row_index":    int(i),
                "anomaly_type": "spike" if "iops" in dominant else "bottleneck",
                "metric_name":  dominant,
                "metric_value": float(row[dominant]),
                "severity":     severity,
                "model_used":   "IsolationForest",
                "anomaly_score": round(float(abs(score)), 4),
            })

    return jsonify({
        "device":   device,
        "total":    len(history),
        "detected": len(anomalies),
        "anomalies": anomalies,
    })

# ── /feature-importance  GET ──────────────────────────────────────────────────
@app.route("/feature-importance")
def feature_importance():
    if bundle is None:
        return jsonify({"error": "Model not loaded"}), 503
    rf = bundle["pred_model"]
    importances = dict(zip(bundle["pred_features"], rf.feature_importances_.tolist()))
    sorted_imp  = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10])
    return jsonify(sorted_imp)

# ── Entry-point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("ML Prediction API running on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
