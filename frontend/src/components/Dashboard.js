import React from "react";

const kpiCards = [
  { key: "avg_utilization",    label: "Avg Disk Util",    unit: "%",  icon: "💿", color: "#3B82F6", bg: "#EFF6FF", warn: 80 },
  { key: "max_utilization",    label: "Peak Utilization", unit: "%",  icon: "📈", color: "#F59E0B", bg: "#FFFBEB", warn: 90 },
  { key: "avg_await_ms",       label: "Avg Await",        unit: "ms", icon: "⏱", color: "#14B8A6", bg: "#F0FDFA", warn: 10 },
  { key: "total_samples",      label: "Samples (1h)",     unit: "",   icon: "📊", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "total_anomalies",    label: "Anomalies (24h)",  unit: "",   icon: "🔍", color: "#F97316", bg: "#FFF7ED" },
  { key: "critical_anomalies", label: "Critical",         unit: "",   icon: "🚨", color: "#EF4444", bg: "#FEF2F2" },
];

export default function Dashboard({ summary, latestOS }) {
  if (!summary) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
      Loading dashboard data…
    </div>
  );

  return (
    <div>
      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16, marginBottom: 28,
      }}>
        {kpiCards.map(({ key, label, unit, icon, color, bg, warn }) => {
          const val = summary[key];
          const isWarn = warn && val >= warn;
          return (
            <div key={key} style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              transition: "transform 0.15s, box-shadow 0.15s",
              cursor: "default",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500, marginBottom: 8, letterSpacing: "0.02em" }}>
                    {label.toUpperCase()}
                  </p>
                  <p style={{
                    fontSize: 28, fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    color: isWarn ? "#EF4444" : "#1E293B",
                    lineHeight: 1,
                  }}>
                    {val !== undefined ? val : "–"}
                    <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 400, marginLeft: 3 }}>{unit}</span>
                  </p>
                  {isWarn && (
                    <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 6, fontWeight: 500 }}>
                      ⚠ Above threshold
                    </p>
                  )}
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: isWarn ? "#FEF2F2" : bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Device Status */}
      {latestOS && latestOS.length > 0 && (
        <div>
          <h3 style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 16, fontWeight: 600,
            color: "#1E293B", marginBottom: 14,
          }}>
            Live Device Status
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {latestOS.map(d => <DeviceCard key={d.device} data={d} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceCard({ data }) {
  const util = data.util_percent || 0;
  const barColor = util > 80 ? "#EF4444" : util > 60 ? "#F59E0B" : "#22C55E";
  const badgeBg  = util > 80 ? "#FEF2F2" : util > 60 ? "#FFFBEB" : "#F0FDF4";
  const badgeColor = util > 80 ? "#EF4444" : util > 60 ? "#F59E0B" : "#16A34A";

  const stats = [
    ["Read IOPS",  data.read_iops?.toFixed(0)],
    ["Write IOPS", data.write_iops?.toFixed(0)],
    ["Await",      `${data.await_ms?.toFixed(1)} ms`],
    ["Read kB/s",  data.read_kbps?.toFixed(0)],
    ["Write kB/s", data.write_kbps?.toFixed(0)],
    ["IOWait",     `${data.iowait_percent?.toFixed(1)}%`],
  ];

  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: 20,
      border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#EFF6FF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>💾</div>
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600, fontSize: 14, color: "#1E293B",
          }}>
            /dev/{data.device}
          </span>
        </div>
        <span style={{
          background: badgeBg, color: badgeColor,
          fontSize: 11, fontWeight: 600,
          padding: "3px 10px", borderRadius: 20,
        }}>
          {util.toFixed(1)}% UTIL
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: "#F1F5F9", borderRadius: 6,
        height: 6, marginBottom: 16, overflow: "hidden",
      }}>
        <div style={{
          width: `${Math.min(util, 100)}%`,
          height: "100%", borderRadius: 6,
          background: barColor,
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {stats.map(([lbl, val]) => (
          <div key={lbl}>
            <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{lbl}</p>
            <p style={{ fontSize: 13, color: "#1E293B", fontWeight: 600 }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
