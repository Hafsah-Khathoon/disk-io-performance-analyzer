"""
metrics-collector/collect_metrics.py
Polls OS disk I/O stats + DBMS stats every N seconds and POSTs to the Node API.
Run: python collect_metrics.py
"""

import os, time, json, subprocess, platform
import requests
import mysql.connector

# ── Config ────────────────────────────────────────────────────────────────────
API_BASE    = os.getenv("API_BASE",    "http://localhost:5000/api/metrics")
INTERVAL    = int(os.getenv("INTERVAL", "10"))      # seconds between polls
DEVICE      = os.getenv("DISK_DEVICE", "sda")

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "user":     os.getenv("DB_USER",     "root"),
    "password": os.getenv("DB_PASSWORD", "Hafsah@1420"),
    "database": os.getenv("DB_NAME",     "disk_io_db"),
}

# ── OS Metric collection ──────────────────────────────────────────────────────
def collect_os_metrics(device=DEVICE):
    """Read /proc/diskstats or use iostat to collect real-time disk I/O."""
    if platform.system() == "Linux":
        return collect_linux(device)
    else:
        return collect_mock(device)

def collect_linux(device):
    try:
        result = subprocess.run(
            ["iostat", "-x", "-d", "1", "1", device],
            capture_output=True, text=True, timeout=5
        )
        lines = [l for l in result.stdout.splitlines() if device in l]
        if not lines:
            return collect_mock(device)
        parts = lines[0].split()
        # iostat -x fields: rrqm/s wrqm/s r/s w/s rkB/s wkB/s avgrq-sz avgqu-sz await r_await w_await svctm %util
        return {
            "device":          device,
            "read_iops":       float(parts[3]),
            "write_iops":      float(parts[4]),
            "read_kbps":       float(parts[5]),
            "write_kbps":      float(parts[6]),
            "await_ms":        float(parts[9]),
            "svctm_ms":        float(parts[12]),
            "util_percent":    float(parts[13]),
            "iowait_percent":  get_cpu_iowait(),
            "queue_depth":     float(parts[8]),
        }
    except Exception as e:
        print(f"[WARN] iostat failed ({e}), using mock data")
        return collect_mock(device)

def get_cpu_iowait():
    try:
        with open("/proc/stat") as f:
            cpu_line = f.readline().split()
        iowait = float(cpu_line[5])
        total  = sum(float(x) for x in cpu_line[1:])
        return round(iowait / total * 100, 2)
    except Exception:
        return 0.0

def collect_mock(device):
    """Simulated data for non-Linux / dev environments."""
    import random, math
    t = time.time()
    return {
        "device":          device,
        "read_iops":       round(1200 + 400*math.sin(t*0.1) + random.uniform(-100, 100), 1),
        "write_iops":      round(800  + 250*math.cos(t*0.08)+ random.uniform(-80,  80),  1),
        "read_kbps":       round(340  + 80 *math.sin(t*0.07)+ random.uniform(-30,  30),  1),
        "write_kbps":      round(190  + 60 *math.cos(t*0.07)+ random.uniform(-20,  20),  1),
        "await_ms":        round(2.2  + 0.5*math.sin(t*0.05)+ random.uniform(-0.2, 0.2), 2),
        "svctm_ms":        round(1.2  + 0.2*math.sin(t*0.05)+ random.uniform(-0.1, 0.1), 2),
        "util_percent":    round(min(100, max(0, 62 + 10*math.sin(t*0.06) + random.uniform(-4,4))), 1),
        "iowait_percent":  round(min(100, max(0, 18 + 5 *math.sin(t*0.06) + random.uniform(-2,2))), 1),
        "queue_depth":     round(4.5  + 1.5*math.sin(t*0.05)+ random.uniform(-0.5, 0.5), 1),
    }

# ── DBMS Metric collection ────────────────────────────────────────────────────
def collect_dbms_metrics():
    """Pull stats from MySQL information_schema / status variables."""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cur  = conn.cursor(dictionary=True)

        cur.execute("SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_%'")
        pool_stats = {}
        for r in cur.fetchall():
            try:
                pool_stats[r["Variable_name"]] = int(r["Value"])
            except (ValueError, TypeError):
                pass  # skip non-numeric values like 'Dumping of buffer pool not started'

        reads   = pool_stats.get("Innodb_buffer_pool_reads",         1)
        r_reqs  = pool_stats.get("Innodb_buffer_pool_read_requests", 1)
        hit_rate = (1 - reads / max(r_reqs, 1)) * 100

        cur.execute("SHOW GLOBAL STATUS WHERE Variable_name IN "
                    "('Innodb_rows_read','Innodb_rows_inserted',"
                    "'Innodb_rows_updated','Innodb_rows_deleted',"
                    "'Innodb_data_written','Deadlocks')")
        row_stats = {}
        for r in cur.fetchall():
            try:
                row_stats[r["Variable_name"]] = int(r["Value"])
            except (ValueError, TypeError):
                pass

        cur.close(); conn.close()

        return {
            "db_name":           DB_CONFIG["database"],
            "buffer_hit_rate":   round(hit_rate, 2),
            "checkpoint_writes": row_stats.get("Innodb_data_written", 0) // 1024,
            "wal_bytes_per_sec": round(row_stats.get("Innodb_data_written", 0) / (INTERVAL * 1024), 2),
            "deadlocks":         row_stats.get("Deadlocks", 0),
            "temp_reads":        0,
            "index_scan_ratio":  91.5,
            "rows_fetched":      row_stats.get("Innodb_rows_read",     0),
            "rows_inserted":     row_stats.get("Innodb_rows_inserted", 0),
            "rows_updated":      row_stats.get("Innodb_rows_updated",  0),
            "rows_deleted":      row_stats.get("Innodb_rows_deleted",  0),
        }
    except Exception as e:
        print(f"[WARN] DBMS collection failed ({e})")
        return None

# ── POST to API ───────────────────────────────────────────────────────────────
def post_metric(endpoint, payload):
    try:
        r = requests.post(f"{API_BASE}/{endpoint}", json=payload, timeout=5)
        return r.status_code == 200 or r.status_code == 201
    except Exception as e:
        print(f"[ERROR] POST to {endpoint} failed: {e}")
        return False

# ── Main loop ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"📡  Metrics collector started. Device={DEVICE}, Interval={INTERVAL}s")
    print(f"    API → {API_BASE}\n")

    cycle = 0
    while True:
        cycle += 1
        print(f"[Cycle {cycle}] Collecting…", end=" ")

        os_data = collect_os_metrics(DEVICE)
        ok = post_metric("os", os_data)
        print(f"OS: {'✅' if ok else '❌'}", end="  ")

        if cycle % 3 == 0:          # DBMS every 30 s
            dbms_data = collect_dbms_metrics()
            if dbms_data:
                ok2 = post_metric("dbms", dbms_data)
                print(f"DBMS: {'✅' if ok2 else '❌'}", end="  ")

        print()
        time.sleep(INTERVAL)
