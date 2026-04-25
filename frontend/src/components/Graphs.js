import React from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, defs, linearGradient, stop,
} from "recharts";

/* ── Shared styles ─────────────────────────────────────────── */
const tooltip = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: "#1E293B",
    padding: "10px 14px",
  },
  labelStyle: { color: "#64748B", fontWeight: 600, marginBottom: 4 },
  cursor: { stroke: "#E2E8F0", strokeWidth: 1 },
};

const axis = {
  tick: { fill: "#94A3B8", fontSize: 11, fontFamily: "'Inter', sans-serif" },
  axisLine: { stroke: "#F1F5F9" },
  tickLine: false,
};

const grid = { strokeDasharray: "4 4", stroke: "#F1F5F9", vertical: false };

const legend = {
  wrapperStyle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: "#64748B",
    paddingTop: 12,
  },
};

/* ── IOPS Chart ─────────────────────────────────────────────── */
export function IOPSChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="writeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#14B8A6" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey="time" {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltip} />
        <Legend {...legend} />
        <Area
          type="monotoneX" dataKey="read_iops" name="Read IOPS"
          stroke="#3B82F6" strokeWidth={2.5}
          fill="url(#readGrad)" dot={false}
          activeDot={{ r: 4, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          type="monotoneX" dataKey="write_iops" name="Write IOPS"
          stroke="#14B8A6" strokeWidth={2.5}
          fill="url(#writeGrad)" dot={false}
          activeDot={{ r: 4, fill: "#14B8A6", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Latency Chart ──────────────────────────────────────────── */
export function LatencyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey="time" {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltip} />
        <Legend {...legend} />
        <Line
          type="monotoneX" dataKey="await_ms" name="Await (ms)"
          stroke="#F59E0B" strokeWidth={2.5} dot={false}
          activeDot={{ r: 4, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
        />
        <Line
          type="monotoneX" dataKey="svctm_ms" name="Svctm (ms)"
          stroke="#8B5CF6" strokeWidth={2.5} dot={false}
          strokeDasharray="6 3"
          activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Utilization Chart ──────────────────────────────────────── */
export function UtilChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B5CF6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="iowaitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F97316" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey="time" {...axis} />
        <YAxis domain={[0, 100]} {...axis} />
        <Tooltip {...tooltip} />
        <Legend {...legend} />
        <Area
          type="monotoneX" dataKey="util_percent" name="Util %"
          stroke="#8B5CF6" strokeWidth={2.5}
          fill="url(#utilGrad)" dot={false}
          activeDot={{ r: 4, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          type="monotoneX" dataKey="iowait_percent" name="IOWait %"
          stroke="#F97316" strokeWidth={2}
          fill="url(#iowaitGrad)" dot={false}
          strokeDasharray="5 3"
          activeDot={{ r: 4, fill: "#F97316", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Prediction Chart ───────────────────────────────────────── */
export function PredictionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey="time" {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tooltip} />
        <Legend {...legend} />
        <Area
          type="monotoneX" dataKey="predicted_iops" name="Predicted IOPS"
          stroke="#3B82F6" strokeWidth={2.5}
          fill="url(#predGrad)" strokeDasharray="7 3"
          dot={{ r: 3, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Benchmark Bar Chart ────────────────────────────────────── */
export function BenchmarkBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} barGap={3} barCategoryGap="30%">
        <CartesianGrid {...grid} />
        <XAxis dataKey="algo_name" {...axis} />
        <YAxis domain={[0.8, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} {...axis} />
        <Tooltip {...tooltip} formatter={(v) => `${(v * 100).toFixed(1)}%`} />
        <Legend {...legend} />
        <Bar dataKey="precision_score" name="Precision" fill="#3B82F6" radius={[5,5,0,0]} maxBarSize={24} />
        <Bar dataKey="recall_score"    name="Recall"    fill="#14B8A6" radius={[5,5,0,0]} maxBarSize={24} />
        <Bar dataKey="f1_score"        name="F1 Score"  fill="#F59E0B" radius={[5,5,0,0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Workload Radar ─────────────────────────────────────────── */
export function WorkloadRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#64748B", fontSize: 11, fontFamily: "'Inter', sans-serif" }}
        />
        <Radar
          name="Score" dataKey="A"
          stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip {...tooltip} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
