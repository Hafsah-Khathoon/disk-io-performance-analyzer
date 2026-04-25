import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";

const tabs = [
  { to: "/",        label: "Dashboard",   end: true },
  { to: "/metrics", label: "OS Metrics"  },
  { to: "/dbms",    label: "DBMS"        },
  { to: "/predict", label: "Predictions" },
  { to: "/anomaly", label: "Anomalies"   },
  { to: "/algos",   label: "Algorithms"  },
];

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        {/* ── Navbar ── */}
        <nav style={{
          background: "#fff",
          borderBottom: "1px solid #E2E8F0",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 60,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #3B82F6, #14B8A6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>D</span>
            </div>
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700, fontSize: 16,
              color: "#1E293B", letterSpacing: "-0.3px",
            }}>
              DiskIQ
            </span>
          </div>

          {/* Nav Links */}
          {tabs.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              fontFamily: "'Inter', sans-serif",
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#3B82F6" : "#64748B",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 8,
              background: isActive ? "#EFF6FF" : "transparent",
              transition: "all 0.15s ease",
            })}>
              {label}
            </NavLink>
          ))}

          {/* Right side badge */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#F0FDF4", color: "#16A34A",
              fontSize: 12, fontWeight: 500,
              padding: "4px 10px", borderRadius: 20,
              border: "1px solid #BBF7D0",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#22C55E", display: "inline-block",
              }} />
              Live
            </span>
          </div>
        </nav>

        {/* ── Page Content ── */}
        <Routes>
          <Route path="/"        element={<Home tab="dashboard" />} />
          <Route path="/metrics" element={<Home tab="metrics"   />} />
          <Route path="/dbms"    element={<Home tab="dbms"      />} />
          <Route path="/predict" element={<Home tab="predict"   />} />
          <Route path="/anomaly" element={<Home tab="anomaly"   />} />
          <Route path="/algos"   element={<Home tab="algos"     />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
