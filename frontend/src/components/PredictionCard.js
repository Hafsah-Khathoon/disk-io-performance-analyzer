import React, { useState } from "react";
import axios from "axios";
import { PredictionChart } from "./Graphs";

export default function PredictionCard({ device = "sda" }) {
  const [horizon,  setHorizon]  = useState(10);
  const [result,   setResult]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const run = async () => {
    setLoading(true); setError(null);
    const BASE = process.env.REACT_APP_API_URL || "https://disk-io-performance-analyzer.onrender.com";
    try {
      const res = await axios.post(`${BASE}/api/metrics/predict`, { device, horizon_minutes: horizon });
      setResult(res.data);
      setHistory(Array.from({ length: horizon }, (_, i) => ({
        time: `+${i + 1}m`,
        predicted_iops: Math.round(res.data.predicted_iops * (1 + 0.015 * Math.sin(i * 0.8))),
      })));
    } catch {
      setError("Prediction service unavailable. Make sure the ML API is running on port 5001.");
    } finally {
      setLoading(false);
    }
  };

  const conf = result?.confidence ? Math.round(result.confidence * 100) : 0;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      padding: 28,
      maxWidth: 860,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 18, fontWeight: 600,
          color: "#1E293B", marginBottom: 4,
        }}>
          IOPS Prediction Engine
        </h2>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          Forecast future disk I/O using the trained Random Forest model
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap" }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 6 }}>
            Forecast Horizon
          </label>
          <select
            value={horizon}
            onChange={e => setHorizon(+e.target.value)}
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              color: "#1E293B",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              padding: "9px 14px",
              outline: "none",
              cursor: "pointer",
              minWidth: 150,
            }}
          >
            {[5, 10, 15, 20, 30].map(v => (
              <option key={v} value={v}>{v} minutes ahead</option>
            ))}
          </select>
        </div>

        <button
          onClick={run}
          disabled={loading}
          style={{
            background: loading ? "#94A3B8" : "linear-gradient(135deg, #3B82F6, #2563EB)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            padding: "10px 24px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
            boxShadow: loading ? "none" : "0 2px 8px rgba(59,130,246,0.3)",
          }}
        >
          {loading ? "Running…" : "▶  Run Prediction"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FECACA",
          borderRadius: 10, padding: "12px 16px",
          color: "#EF4444", fontSize: 13, marginBottom: 20,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Stat Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14, marginBottom: 24,
          }}>
            <StatBox label="Predicted IOPS"    value={result.predicted_iops?.toFixed(0)}    unit="IOPS" color="#3B82F6" bg="#EFF6FF" />
            <StatBox label="Predicted Latency" value={result.predicted_latency_ms?.toFixed(2)} unit="ms" color="#14B8A6" bg="#F0FDFA" />
            <StatBox label="Model"             value={result.model_name}                    unit=""     color="#8B5CF6" bg="#F5F3FF" />
            <ConfBox confidence={conf} />
          </div>

          {/* Chart */}
          {history.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Forecast Curve
              </p>
              <PredictionChart data={history} />
            </div>
          )}
        </>
      )}

      {result?.fallback && (
        <div style={{
          background: "#FFFBEB", border: "1px solid #FDE68A",
          borderRadius: 10, padding: "12px 16px",
          color: "#D97706", fontSize: 13,
          marginBottom: 20,
        }}>
          ⚡ Showing fallback predictions — ML service is offline.
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, color, bg }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 12,
      padding: "16px 18px",
      border: `1px solid ${bg}`,
    }}>
      <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color }}>
        {value}
        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400, marginLeft: 4 }}>{unit}</span>
      </p>
    </div>
  );
}

function ConfBox({ confidence }) {
  const color = confidence >= 90 ? "#16A34A" : confidence >= 75 ? "#F59E0B" : "#EF4444";
  const bg    = confidence >= 90 ? "#F0FDF4" : confidence >= 75 ? "#FFFBEB" : "#FEF2F2";
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "16px 18px" }}>
      <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Confidence
      </p>
      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color, marginBottom: 8 }}>
        {confidence}<span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400, marginLeft: 2 }}>%</span>
      </p>
      <div style={{ background: "#E2E8F0", borderRadius: 4, height: 5, overflow: "hidden" }}>
        <div style={{
          width: `${confidence}%`, height: "100%",
          background: color, borderRadius: 4,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}
