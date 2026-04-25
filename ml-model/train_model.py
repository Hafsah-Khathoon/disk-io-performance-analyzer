"""
ml-model/train_model.py
Train anomaly detection + IOPS prediction models
"""

import pandas as pd
import numpy as np
import pickle, os, json
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings; warnings.filterwarnings("ignore")

FEATURES = [
    "read_iops","write_iops","read_kbps","write_kbps",
    "await_ms","svctm_ms","util_percent","iowait_percent","queue_depth"
]

# ── Load data ─────────────────────────────────────────────────────────────────
def load_data(path="dataset.csv"):
    if not os.path.exists(path):
        print(f"[WARN] {path} not found – generating synthetic data")
        return generate_synthetic_data()
    df = pd.read_csv(path, parse_dates=["collected_at"])
    df.sort_values("collected_at", inplace=True)
    return df

def generate_synthetic_data(n=5000):
    """Generate realistic synthetic disk I/O data for training."""
    np.random.seed(42)
    t = np.arange(n)
    df = pd.DataFrame({
        "collected_at":    pd.date_range("2024-01-01", periods=n, freq="min"),
        "device":          np.random.choice(["sda","nvme0n1"], n),
        "read_iops":       np.abs(1200 + 400*np.sin(t*0.05) + np.random.randn(n)*150),
        "write_iops":      np.abs(800  + 250*np.cos(t*0.04) + np.random.randn(n)*100),
        "read_kbps":       np.abs(340  + 80 *np.sin(t*0.03) + np.random.randn(n)*40),
        "write_kbps":      np.abs(190  + 60 *np.cos(t*0.03) + np.random.randn(n)*30),
        "await_ms":        np.abs(2.2  + 0.5*np.sin(t*0.02) + np.random.randn(n)*0.3),
        "svctm_ms":        np.abs(1.2  + 0.2*np.sin(t*0.02) + np.random.randn(n)*0.15),
        "util_percent":    np.clip(62  + 10 *np.sin(t*0.04) + np.random.randn(n)*5, 0, 100),
        "iowait_percent":  np.clip(18  + 5  *np.sin(t*0.04) + np.random.randn(n)*3, 0, 100),
        "queue_depth":     np.abs(4.5  + 1.5*np.sin(t*0.05) + np.random.randn(n)*0.8),
    })
    # inject anomalies (~5%)
    anom_idx = np.random.choice(n, size=int(n*0.05), replace=False)
    df.loc[anom_idx, "read_iops"]    *= np.random.uniform(2.5, 4.0, size=len(anom_idx))
    df.loc[anom_idx, "util_percent"]  = np.clip(df.loc[anom_idx, "util_percent"] * 1.5, 0, 100)
    df.loc[anom_idx, "await_ms"]     *= np.random.uniform(3, 8, size=len(anom_idx))
    df["is_anomaly"] = 0
    df.loc[anom_idx, "is_anomaly"] = 1
    df.to_csv("dataset.csv", index=False)
    print(f"[INFO] Synthetic dataset saved → dataset.csv ({n} rows, {len(anom_idx)} anomalies)")
    return df

# ── Anomaly Detection: Isolation Forest ──────────────────────────────────────
def train_anomaly_model(df):
    print("\n[1/3] Training Isolation Forest anomaly detector...")
    X = df[FEATURES].fillna(0)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        max_features=len(FEATURES),
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    scores = model.decision_function(X_scaled)
    preds  = model.predict(X_scaled)           # -1 = anomaly, 1 = normal

    # Evaluate against labels if available
    if "is_anomaly" in df.columns:
        from sklearn.metrics import classification_report
        y_true = df["is_anomaly"].values
        y_pred = (preds == -1).astype(int)
        print(classification_report(y_true, y_pred, target_names=["normal","anomaly"]))

    return model, scaler

# ── Prediction Model: Random Forest (IOPS forecasting) ───────────────────────
def train_prediction_model(df):
    print("\n[2/3] Training Random Forest IOPS predictor...")
    df = df.sort_values("collected_at").reset_index(drop=True)

    # create lag features (5-step look-back)
    for lag in [1, 2, 3, 5]:
        df[f"read_iops_lag{lag}"]  = df["read_iops"].shift(lag)
        df[f"write_iops_lag{lag}"] = df["write_iops"].shift(lag)
        df[f"await_lag{lag}"]      = df["await_ms"].shift(lag)
    df.dropna(inplace=True)

    feature_cols = FEATURES + [c for c in df.columns if "lag" in c]
    X = df[feature_cols]
    y = df["read_iops"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    rf = RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    preds = rf.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    rmse  = np.sqrt(mean_squared_error(y_test, preds))
    print(f"   MAE={mae:.1f} IOPS  |  RMSE={rmse:.1f} IOPS")

    return rf, feature_cols

# ── Save artefacts ────────────────────────────────────────────────────────────
def save_models(anomaly_model, anomaly_scaler, pred_model, pred_features):
    print("\n[3/3] Saving model artefacts...")
    with open("model.pkl", "wb") as f:
        pickle.dump({
            "anomaly_model":   anomaly_model,
            "anomaly_scaler":  anomaly_scaler,
            "pred_model":      pred_model,
            "pred_features":   pred_features,
            "base_features":   FEATURES,
        }, f)
    print("   ✅  model.pkl saved")

    # also dump feature list for the API
    meta = {"base_features": FEATURES, "pred_features": pred_features}
    with open("model_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print("   ✅  model_meta.json saved")

# ── Entry-point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    df = load_data()
    anomaly_model, anomaly_scaler = train_anomaly_model(df)
    pred_model, pred_features     = train_prediction_model(df)
    save_models(anomaly_model, anomaly_scaler, pred_model, pred_features)
    print("\n🎉  Training complete! Run predict.py to start the Flask ML API.")
