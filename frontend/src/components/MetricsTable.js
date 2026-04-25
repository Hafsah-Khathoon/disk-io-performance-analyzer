import React from "react";

/* ── Shared table styles ──────────────────────────────────── */
const tableWrap = {
  overflowX: "auto",
  borderRadius: 12,
  border: "1px solid #E2E8F0",
  background: "#fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const th = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "#94A3B8",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderBottom: "1px solid #F1F5F9",
  background: "#FAFAFA",
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
};

const td = (highlight) => ({
  padding: "10px 16px",
  fontSize: 13,
  color: highlight || "#334155",
  borderBottom: "1px solid #F8FAFC",
  whiteSpace: "nowrap",
  fontFamily: "'Inter', sans-serif",
  fontWeight: highlight ? 600 : 400,
});

const severityStyle = (s) => {
  const map = {
    critical: { bg: "#FEF2F2", color: "#EF4444", border: "#FECACA" },
    high:     { bg: "#FFFBEB", color: "#F59E0B", border: "#FDE68A" },
    medium:   { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    low:      { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
  };
  const s2 = map[s] || { bg: "#F8FAFC", color: "#64748B", border: "#E2E8F0" };
  return {
    display: "inline-block",
    background: s2.bg, color: s2.color,
    border: `1px solid ${s2.border}`,
    fontSize: 11, fontWeight: 600,
    padding: "2px 10px", borderRadius: 20,
    textTransform: "capitalize",
    fontFamily: "'Inter', sans-serif",
  };
};

function Empty({ msg }) {
  return (
    <div style={{
      textAlign: "center", padding: "48px 0",
      color: "#94A3B8", fontSize: 13,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
      {msg}
    </div>
  );
}

/* ── OS Metrics Table ─────────────────────────────────────── */
export function OSMetricsTable({ rows = [] }) {
  if (!rows.length) return <Empty msg="No OS metrics loaded" />;
  const cols = [
    { key: "collected_at", label: "Time" },
    { key: "device",       label: "Device" },
    { key: "read_iops",    label: "Read IOPS" },
    { key: "write_iops",   label: "Write IOPS" },
    { key: "read_kbps",    label: "Read kB/s" },
    { key: "write_kbps",   label: "Write kB/s" },
    { key: "await_ms",     label: "Await (ms)" },
    { key: "util_percent", label: "Util %" },
    { key: "iowait_percent", label: "IOWait %" },
    { key: "queue_depth",  label: "Queue" },
  ];
  return (
    <div style={tableWrap}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{cols.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              {cols.map(c => {
                const val = c.key === "collected_at"
                  ? new Date(r[c.key]).toLocaleTimeString()
                  : r[c.key];
                const highlight =
                  c.key === "util_percent" && r[c.key] > 80 ? "#EF4444" :
                  c.key === "await_ms"     && r[c.key] > 5  ? "#F59E0B" : null;
                return <td key={c.key} style={td(highlight)}>{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Anomaly Table ────────────────────────────────────────── */
export function AnomalyTable({ rows = [] }) {
  if (!rows.length) return <Empty msg="No anomalies detected" />;
  return (
    <div style={tableWrap}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Time","Device","Type","Metric","Value","Severity","Model","Score"].map(h =>
              <th key={h} style={th}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              <td style={td()}>{new Date(r.detected_at).toLocaleTimeString()}</td>
              <td style={td("#3B82F6")}>{r.device}</td>
              <td style={td()}>{r.anomaly_type}</td>
              <td style={td()}>{r.metric_name}</td>
              <td style={td("#1E293B")}>{r.metric_value}</td>
              <td style={td()}><span style={severityStyle(r.severity)}>{r.severity}</span></td>
              <td style={td()}>{r.model_used}</td>
              <td style={td("#8B5CF6")}>{r.anomaly_score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── DBMS Table ───────────────────────────────────────────── */
export function DBMSTable({ rows = [] }) {
  if (!rows.length) return <Empty msg="No DBMS metrics loaded" />;
  const cols = [
    { key: "collected_at",      label: "Time" },
    { key: "db_name",           label: "Database" },
    { key: "buffer_hit_rate",   label: "Buffer Hit %" },
    { key: "checkpoint_writes", label: "Checkpoints" },
    { key: "wal_bytes_per_sec", label: "WAL B/s" },
    { key: "deadlocks",         label: "Deadlocks" },
    { key: "temp_reads",        label: "Temp Reads" },
    { key: "index_scan_ratio",  label: "Index Scan %" },
  ];
  return (
    <div style={tableWrap}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{cols.map(c => <th key={c.key} style={th}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              {cols.map(c => {
                const val = c.key === "collected_at"
                  ? new Date(r[c.key]).toLocaleTimeString()
                  : r[c.key];
                const highlight =
                  c.key === "buffer_hit_rate" && r[c.key] < 95 ? "#F59E0B" :
                  c.key === "deadlocks"        && r[c.key] > 0  ? "#EF4444" : null;
                return <td key={c.key} style={td(highlight)}>{val}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Benchmark Table ──────────────────────────────────────── */
export function BenchmarkTable({ rows = [] }) {
  if (!rows.length) return <Empty msg="No benchmark data" />;
  const best = [...rows].sort((a,b) => b.f1_score - a.f1_score)[0]?.algo_name;
  return (
    <div style={tableWrap}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["#","Algorithm","Precision","Recall","F1 Score","Train (s)","Predict (ms)","Rows"].map(h =>
              <th key={h} style={th}>{h}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.algo_name === best ? "#FFFBEB" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              <td style={td()}><span style={{ fontSize:12, fontWeight:700, color:"#94A3B8" }}>#{i+1}</span></td>
              <td style={{ ...td("#3B82F6"), fontWeight:600 }}>
                {r.algo_name}
                {r.algo_name === best && <span style={{ marginLeft:6, fontSize:10, background:"#FEF9C3", color:"#CA8A04", padding:"1px 6px", borderRadius:10, fontWeight:700 }}>BEST</span>}
              </td>
              <td style={td()}>{(r.precision_score * 100).toFixed(1)}%</td>
              <td style={td()}>{(r.recall_score    * 100).toFixed(1)}%</td>
              <td style={{ ...td("#16A34A"), fontWeight:700 }}>{(r.f1_score * 100).toFixed(1)}%</td>
              <td style={td()}>{r.train_time_sec}s</td>
              <td style={td()}>{r.predict_time_ms}ms</td>
              <td style={td()}>{r.dataset_rows?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
