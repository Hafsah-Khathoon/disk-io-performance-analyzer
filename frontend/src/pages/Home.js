import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Dashboard from "../components/Dashboard";
import PredictionCard from "../components/PredictionCard";
import { OSMetricsTable, AnomalyTable, DBMSTable, BenchmarkTable } from "../components/MetricsTable";
import { IOPSChart, LatencyChart, UtilChart, BenchmarkBarChart, WorkloadRadar } from "../components/Graphs";

const WORKLOAD_DATA = [
  { subject: "Seq Read",  A: 92 }, { subject: "Seq Write",  A: 78 },
  { subject: "Rand Read", A: 65 }, { subject: "Rand Write", A: 54 },
  { subject: "Mixed R/W", A: 71 }, { subject: "Metadata",   A: 83 },
];

const PAGE         = { padding: "28px 32px", minHeight: "calc(100vh - 60px)", background: "#F8FAFC" };
const CARD         = { background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: 22 };
const CARD_LABEL   = { fontSize: 13, fontWeight: 600, color: "#94A3B8", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Inter',sans-serif" };
const SECTION_TITLE = { fontFamily: "'Times New Roman',Times,serif", fontSize: 18, fontWeight: 600, color: "#1E293B", marginBottom: 14 };

function PageHeader({ title, subtitle, device, setDevice, live, setLive, onRefresh, wsConnected }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:28 }}>
      <div>
        <h1 style={{ fontFamily:"'Times New Roman',Times,serif", fontSize:26, fontWeight:700, color:"#1E293B", letterSpacing:"-0.4px", marginBottom:4 }}>{title}</h1>
        <p style={{ fontSize:14, color:"#94A3B8", fontWeight:500 }}>{subtitle}</p>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:12,
          color: wsConnected ? "#16A34A" : "#EF4444",
          background: wsConnected ? "#F0FDF4" : "#FEF2F2",
          padding:"4px 10px", borderRadius:20,
          border:`1px solid ${wsConnected ? "#BBF7D0" : "#FECACA"}` }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: wsConnected ? "#22C55E" : "#EF4444", display:"inline-block" }} />
          {wsConnected ? "Live" : "Offline"}
        </span>
        <select value={device} onChange={e => setDevice(e.target.value)}
          style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, color:"#1E293B",
            fontFamily:"'Inter',sans-serif", fontSize:13, padding:"7px 14px", outline:"none" }}>
          <option value="sda">sda</option>
          <option value="nvme0n1">nvme0n1</option>
        </select>
        <button onClick={() => setLive(l => !l)} style={{
          background: live ? "#F0FDF4" : "#F8FAFC",
          border:`1px solid ${live ? "#BBF7D0" : "#E2E8F0"}`,
          borderRadius:8, color: live ? "#16A34A" : "#94A3B8",
          fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500,
          padding:"7px 16px", cursor:"pointer" }}>
          {live ? "Pause" : "Resume"}
        </button>
        <button onClick={onRefresh} style={{ background:"#fff", border:"1px solid #E2E8F0",
          borderRadius:8, color:"#64748B", fontFamily:"'Inter',sans-serif",
          fontSize:13, padding:"7px 16px", cursor:"pointer" }}>
          Refresh
        </button>
      </div>
    </div>
  );
}

export default function Home({ tab }) {
  const [osData,      setOsData]      = useState([]);
  const [dbmsData,    setDbmsData]    = useState([]);
  const [anomalies,   setAnomalies]   = useState([]);
  const [benchmarks,  setBenchmarks]  = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [latestOS,    setLatestOS]    = useState([]);
  const [live,        setLive]        = useState(true);
  const [device,      setDevice]      = useState("sda");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  const fetchAll = async () => {
    const BASE = process.env.REACT_APP_API_URL || "https://disk-io-performance-analyzer.onrender.com";
    try {
      const [osRes, dbmsRes, anomRes, benchRes, sumRes, latestRes] = await Promise.allSettled([
        axios.get(`${BASE}/api/metrics/os?device=${device}&limit=30`),
        axios.get(`${BASE}/api/metrics/dbms?limit=20`),
        axios.get(`${BASE}/api/metrics/anomalies?limit=50`),
        axios.get(`${BASE}/api/metrics/benchmarks`),
        axios.get(`${BASE}/api/metrics/summary`),
        axios.get(`${BASE}/api/metrics/os/latest`),
      ]);
      if (osRes.status     === "fulfilled") setOsData(osRes.value.data.data || []);
      if (dbmsRes.status   === "fulfilled") setDbmsData(dbmsRes.value.data.data || []);
      if (anomRes.status   === "fulfilled") setAnomalies(anomRes.value.data.data || []);
      if (benchRes.status  === "fulfilled") setBenchmarks(benchRes.value.data.data || []);
      if (sumRes.status    === "fulfilled") setSummary(sumRes.value.data.data);
      if (latestRes.status === "fulfilled") setLatestOS(latestRes.value.data.data || []);
    } catch {}
  };

  // WebSocket for real-time push
  useEffect(() => {
    const connect = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || "wss://disk-io-performance-analyzer.onrender.com";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        if (!live) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "live") {
            const newRow = {
              ...msg.metrics,
              collected_at: new Date().toISOString(),
              time: new Date().toLocaleTimeString("en-US", { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" }),
            };
            setOsData(prev => [...prev.slice(-29), newRow]);
            setLatestOS([newRow]);
            setSummary(prev => prev ? {
              ...prev,
              avg_utilization:    parseFloat(msg.metrics.util_percent.toFixed(1)),
              avg_await_ms:       parseFloat(msg.metrics.await_ms.toFixed(2)),
              total_anomalies:    (prev.total_anomalies || 0) + msg.anomalies.length,
              critical_anomalies: (prev.critical_anomalies || 0) + msg.anomalies.filter(a => a.severity === "critical").length,
            } : prev);
            if (msg.anomalies.length > 0) {
              const newAnoms = msg.anomalies.map(a => ({ ...a, device: "sda", detected_at: new Date().toISOString() }));
              setAnomalies(prev => [...newAnoms, ...prev].slice(0, 50));
            }
          }
        } catch {}
      };
    };
    connect();
    return () => wsRef.current?.close();
  }, [live]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [device]);

  const chartData = osData.map(r => ({
    ...r,
    time: r.time || new Date(r.collected_at).toLocaleTimeString("en-US",
      { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" }),
  }));

  const hp = { device, setDevice, live, setLive, onRefresh: fetchAll, wsConnected };

  if (tab === "dashboard") return (
    <div style={PAGE}>
      <PageHeader title="Disk I/O Dashboard" subtitle="Real-time performance monitoring from your PC" {...hp} />
      <Dashboard summary={summary} latestOS={latestOS} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(400px,1fr))", gap:20, marginTop:24 }}>
        <div style={CARD}><p style={CARD_LABEL}>IOPS — Real Time</p><IOPSChart data={chartData} /></div>
        <div style={CARD}><p style={CARD_LABEL}>Latency Trend</p><LatencyChart data={chartData} /></div>
      </div>
    </div>
  );

  if (tab === "metrics") return (
    <div style={PAGE}>
      <PageHeader title="OS Metrics" subtitle="Live disk I/O statistics from your system" {...hp} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(380px,1fr))", gap:20, marginBottom:24 }}>
        <div style={CARD}><p style={CARD_LABEL}>Read / Write IOPS</p><IOPSChart data={chartData} /></div>
        <div style={CARD}><p style={CARD_LABEL}>Disk Utilization</p><UtilChart data={chartData} /></div>
        <div style={CARD}><p style={CARD_LABEL}>Service + Wait Time</p><LatencyChart data={chartData} /></div>
        <div style={CARD}><p style={CARD_LABEL}>Workload Profile</p><WorkloadRadar data={WORKLOAD_DATA} /></div>
      </div>
      <p style={SECTION_TITLE}>Raw OS Metrics</p>
      <OSMetricsTable rows={osData.slice().reverse()} />
    </div>
  );

  if (tab === "dbms") return (
    <div style={PAGE}>
      <PageHeader title="DBMS Metrics" subtitle="MySQL internal performance statistics" {...hp} />
      <p style={SECTION_TITLE}>Database Metrics History</p>
      <DBMSTable rows={dbmsData.slice().reverse()} />
    </div>
  );

  if (tab === "predict") return (
    <div style={PAGE}>
      <PageHeader title="IOPS Predictions" subtitle="ML-powered forecasting using Random Forest" {...hp} />
      <PredictionCard device={device} />
    </div>
  );

  if (tab === "anomaly") return (
    <div style={PAGE}>
      <PageHeader title="Anomaly Detection" subtitle="Real-time anomalies detected from your PC metrics" {...hp} />
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Total",    val: anomalies.length,                                    color:"#3B82F6", bg:"#EFF6FF" },
          { label:"Critical", val: anomalies.filter(a=>a.severity==="critical").length, color:"#EF4444", bg:"#FEF2F2" },
          { label:"High",     val: anomalies.filter(a=>a.severity==="high").length,     color:"#F59E0B", bg:"#FFFBEB" },
          { label:"Medium",   val: anomalies.filter(a=>a.severity==="medium").length,   color:"#D97706", bg:"#FFFBEB" },
          { label:"Low",      val: anomalies.filter(a=>a.severity==="low").length,      color:"#16A34A", bg:"#F0FDF4" },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background:bg, borderRadius:10, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20, fontWeight:700, color, fontFamily:"'Poppins',sans-serif" }}>{val}</span>
            <span style={{ fontSize:12, color:"#64748B", fontWeight:500 }}>{label}</span>
          </div>
        ))}
      </div>
      <AnomalyTable rows={anomalies} />
    </div>
  );

  if (tab === "algos") return (
    <div style={PAGE}>
      <PageHeader title="Algorithm Comparison" subtitle="Precision, Recall and F1 scores across all ML models" {...hp} />
      <AlgorithmsPage benchmarks={benchmarks} />
    </div>
  );

  return null;
}

// ── Algorithm Page Component ──────────────────────────────────
const ALGO_META = {
  IsolationForest: { icon: "🌲", color: "#3B82F6", bg: "#EFF6FF", task: "Anomaly Detection",    desc: "Unsupervised isolation-based anomaly scorer" },
  LSTM:            { icon: "🧠", color: "#8B5CF6", bg: "#F5F3FF", task: "Time-Series Forecast", desc: "Deep learning for long-term temporal patterns" },
  RandomForest:    { icon: "🌳", color: "#14B8A6", bg: "#F0FDFA", task: "IOPS Prediction",      desc: "Ensemble of 150 trees with lag features" },
  XGBoost:         { icon: "⚡", color: "#F59E0B", bg: "#FFFBEB", task: "Bottleneck Classifier", desc: "Gradient boosted trees, fast inference" },
  Autoencoder:     { icon: "🔄", color: "#F97316", bg: "#FFF7ED", task: "Pattern Detection",    desc: "Learns normal behavior via reconstruction" },
};

function AlgorithmsPage({ benchmarks }) {
  const [selected, setSelected] = React.useState(null);

  // Sort by F1 descending
  const sorted = [...benchmarks].sort((a, b) => b.f1_score - a.f1_score);
  const best   = sorted[0];

  return (
    <div>
      {/* Top summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
        {[
          { label:"Models Compared",  value: benchmarks.length,                                                    unit:"",   color:"#3B82F6", bg:"#EFF6FF", icon:"🤖" },
          { label:"Best F1 Score",    value: best ? `${(best.f1_score*100).toFixed(1)}%` : "–",                   unit:"",   color:"#16A34A", bg:"#F0FDF4", icon:"🏆" },
          { label:"Best Model",       value: best?.algo_name || "–",                                               unit:"",   color:"#8B5CF6", bg:"#F5F3FF", icon:"🌟" },
          { label:"Avg Precision",    value: benchmarks.length ? `${(benchmarks.reduce((s,r)=>s+r.precision_score,0)/benchmarks.length*100).toFixed(1)}%` : "–", unit:"", color:"#F59E0B", bg:"#FFFBEB", icon:"🎯" },
          { label:"Avg Recall",       value: benchmarks.length ? `${(benchmarks.reduce((s,r)=>s+r.recall_score,0)/benchmarks.length*100).toFixed(1)}%` : "–",    unit:"", color:"#14B8A6", bg:"#F0FDFA", icon:"📡" },
          { label:"Dataset Size",     value: best ? (best.dataset_rows/1000).toFixed(0)+"K" : "–",                unit:"rows", color:"#F97316", bg:"#FFF7ED", icon:"📊" },
        ].map(({ label, value, unit, color, bg, icon }) => (
          <div key={label} style={{
            background:"#fff", borderRadius:14, padding:"18px 20px",
            border:"1px solid #E2E8F0", boxShadow:"0 1px 4px rgba(0,0,0,0.05)",
            transition:"transform 0.15s, box-shadow 0.15s", cursor:"default",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 16px rgba(0,0,0,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)";    e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)"; }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:11, color:"#94A3B8", fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</p>
                <p style={{ fontSize:24, fontWeight:700, fontFamily:"'Poppins',sans-serif", color, lineHeight:1 }}>
                  {value}<span style={{ fontSize:12, color:"#94A3B8", fontWeight:400, marginLeft:3 }}>{unit}</span>
                </p>
              </div>
              <div style={{ width:38, height:38, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Algorithm cards grid */}
      <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:600, color:"#1E293B", marginBottom:14 }}>Model Performance Cards</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:28 }}>
        {sorted.map((r, i) => {
          const meta = ALGO_META[r.algo_name] || { icon:"🤖", color:"#64748B", bg:"#F8FAFC", task:"ML Model", desc:"" };
          const isSelected = selected === r.algo_name;
          const isBest = i === 0;
          return (
            <div key={r.algo_name}
              onClick={() => setSelected(isSelected ? null : r.algo_name)}
              style={{
                background:"#fff", borderRadius:14, padding:20,
                border:`1.5px solid ${isSelected ? meta.color : "#E2E8F0"}`,
                boxShadow: isSelected ? `0 4px 20px ${meta.color}22` : "0 1px 4px rgba(0,0,0,0.05)",
                cursor:"pointer", transition:"all 0.2s",
                position:"relative", overflow:"hidden",
              }}
              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor=meta.color; e.currentTarget.style.transform="translateY(-2px)"; }}}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.transform="translateY(0)"; }}}
            >
              {isBest && (
                <div style={{ position:"absolute", top:12, right:12, background:"#FEF9C3", color:"#CA8A04",
                  fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, border:"1px solid #FDE68A" }}>
                  BEST
                </div>
              )}
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:meta.bg,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                  {meta.icon}
                </div>
                <div>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:14, color:"#1E293B", marginBottom:2 }}>{r.algo_name}</p>
                  <p style={{ fontSize:11, color:meta.color, fontWeight:500 }}>{meta.task}</p>
                </div>
              </div>

              {/* Metric bars */}
              {[
                { label:"Precision", value: r.precision_score, color:"#3B82F6" },
                { label:"Recall",    value: r.recall_score,    color:"#14B8A6" },
                { label:"F1 Score",  value: r.f1_score,        color:"#F59E0B" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:"#94A3B8", fontWeight:500 }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color }}>{(value*100).toFixed(1)}%</span>
                  </div>
                  <div style={{ background:"#F1F5F9", borderRadius:4, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${value*100}%`, height:"100%", background:color, borderRadius:4, transition:"width 0.8s ease" }} />
                  </div>
                </div>
              ))}

              {/* Footer stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:14,
                paddingTop:14, borderTop:"1px solid #F1F5F9" }}>
                <div>
                  <p style={{ fontSize:10, color:"#94A3B8", fontWeight:500, marginBottom:2, textTransform:"uppercase" }}>Train Time</p>
                  <p style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{r.train_time_sec}s</p>
                </div>
                <div>
                  <p style={{ fontSize:10, color:"#94A3B8", fontWeight:500, marginBottom:2, textTransform:"uppercase" }}>Predict Time</p>
                  <p style={{ fontSize:13, fontWeight:600, color:"#1E293B" }}>{r.predict_time_ms}ms</p>
                </div>
              </div>

              {/* Description on select */}
              {isSelected && (
                <div style={{ marginTop:12, padding:"10px 12px", background:meta.bg, borderRadius:8 }}>
                  <p style={{ fontSize:12, color:meta.color, fontWeight:500 }}>{meta.desc}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div style={{ background:"#fff", borderRadius:14, border:"1px solid #E2E8F0", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", padding:22, marginBottom:24 }}>
        <p style={{ fontSize:12, fontWeight:600, color:"#94A3B8", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>Precision / Recall / F1 — All Models</p>
        <p style={{ fontSize:12, color:"#CBD5E1", marginBottom:16 }}>Click a model card above to highlight details</p>
        <BenchmarkBarChart data={sorted} />
      </div>

      {/* Detailed table */}
      <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:600, color:"#1E293B", marginBottom:14 }}>Detailed Benchmark Results</p>
      <BenchmarkTable rows={sorted} />
    </div>
  );
}
