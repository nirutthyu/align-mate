import React, { useEffect, useState } from "react";
import "./Admin.css";

const AVATAR_PALETTE = [
  { bg: "var(--accent-dim)",  fg: "var(--accent)"  },
  { bg: "var(--green-dim)",   fg: "var(--green)"   },
  { bg: "var(--amber-dim)",   fg: "var(--amber)"   },
  { bg: "var(--red-dim)",     fg: "var(--red)"     },
  { bg: "var(--purple-dim)",  fg: "var(--purple)"  },
  { bg: "var(--teal-dim)",    fg: "var(--teal)"    },
];

function getCompatClass(compat) {
  const n = parseFloat(compat);
  if (isNaN(n))  return "compat-mid";
  if (n >= 0.75) return "compat-hi";
  if (n >= 0.45) return "compat-mid";
  return "compat-lo";
}

function getCompatColor(compat) {
  const cls = getCompatClass(compat);
  if (cls === "compat-hi")  return "var(--green)";
  if (cls === "compat-mid") return "var(--amber)";
  return "var(--red)";
}

function getCompatPct(compat) {
  const n = parseFloat(compat);
  if (isNaN(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n * 100)));
}

function getName(email) {
  return email ? email.split("@")[0] : "unknown";
}

function Avatar({ name, index }) {
  const { bg, fg } = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  return (
    <div className="adm-avatar" style={{ background: bg, color: fg }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminDashboard() {
  const [rooms, setRooms]               = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");

  // CHANGE: publish state
  const [status, setStatus]             = useState(null);   // { published, completedCount, expectedCount, canPublish }
  const [publishing, setPublishing]     = useState(false);
  const [publishMsg, setPublishMsg]     = useState(null);   // { type: 'success'|'error', text }

  // Fetch rooms
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/rooms")
      .then(res => res.json())
      .then(data => { setRooms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // CHANGE: Fetch publish status on mount and poll every 5s so count stays live
  useEffect(() => {
    function fetchStatus() {
      fetch("http://localhost:5000/api/admin/status")
        .then(res => res.json())
        .then(data => setStatus(data))
        .catch(() => {});
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // CHANGE: Publish / unpublish handler
  async function handlePublish(publish) {
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res  = await fetch("http://localhost:5000/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => ({ ...prev, published: data.published }));
        setPublishMsg({
          type: "success",
          text: data.published
            ? "Room allotments published! Students can now view their rooms."
            : "Results hidden from students."
        });
      } else {
        setPublishMsg({ type: "error", text: data.error || "Failed to update." });
      }
    } catch {
      setPublishMsg({ type: "error", text: "Server error. Try again." });
    } finally {
      setPublishing(false);
    }
  }

  const filtered = rooms.filter(r =>
    r.roomId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-root">

      {/* Top Bar */}
      <div className="adm-topbar">
        <div className="adm-logo">
          <div className="adm-logo-icon">🏠</div>
          <div>
            <div className="adm-logo-text">AlignMate</div>
            <div className="adm-logo-sub">Admin Console</div>
          </div>
        </div>

        {/* CHANGE: Publish controls in topbar */}
        {status && (
          <div className="adm-publish-area">

            {/* Student count badge */}
            <div className="adm-student-count">
              <span
                className="adm-count-fraction"
                style={{ color: status.canPublish ? "var(--green)" : "var(--amber)" }}
              >
                {status.completedCount} / {status.expectedCount}
              </span>
              <span className="adm-count-label">students done</span>
              {/* Progress bar */}
              <div className="adm-count-bar-bg">
                <div
                  className="adm-count-bar"
                  style={{
                    width: `${Math.min(100, (status.completedCount / status.expectedCount) * 100)}%`,
                    background: status.canPublish ? "var(--green)" : "var(--amber)"
                  }}
                />
              </div>
            </div>

            {/* Publish / Unpublish button */}
            {!status.published ? (
              <button
                className={`adm-publish-btn${status.canPublish ? " ready" : " disabled"}`}
                onClick={() => status.canPublish && handlePublish(true)}
                disabled={!status.canPublish || publishing}
                title={
                  !status.canPublish
                    ? `Waiting for ${status.expectedCount - status.completedCount} more student(s)`
                    : "Publish room allotments to students"
                }
              >
                {publishing ? "Publishing…" : "🚀 Publish Results"}
              </button>
            ) : (
              <button
                className="adm-publish-btn unpublish"
                onClick={() => handlePublish(false)}
                disabled={publishing}
              >
                {publishing ? "Hiding…" : "🔒 Unpublish"}
              </button>
            )}

            {/* Published status badge */}
            <span className={`adm-published-badge ${status.published ? "live" : "draft"}`}>
              {status.published ? "● Live" : "○ Draft"}
            </span>

          </div>
        )}
      </div>

      {/* CHANGE: Publish message toast */}
      {publishMsg && (
        <div
          className={`adm-toast ${publishMsg.type}`}
          onClick={() => setPublishMsg(null)}
        >
          {publishMsg.type === "success" ? "✓ " : "✕ "}
          {publishMsg.text}
          <span className="adm-toast-close">×</span>
        </div>
      )}

      {loading ? (
        <div className="adm-loading">
          <div className="adm-spinner" />
          <div className="adm-loading-text">Fetching room data…</div>
        </div>
      ) : (
        <div className="adm-body">

          {/* ── Left Panel ── */}
          <div className="adm-left">
            <div className="adm-section-header">
              <span className="adm-section-title">Room Assignments</span>
              <span className="adm-count-pill">{rooms.length} rooms</span>
            </div>

            <div className="adm-search-wrap">
              <span className="adm-search-icon">⌕</span>
              <input
                className="adm-search"
                placeholder="Search room ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="adm-grid">
              {filtered.map((room, i) => {
                const pct      = getCompatPct(room.compatibility);
                const color    = getCompatColor(room.compatibility);
                const isActive = selectedRoom?.roomId === room.roomId;

                return (
                  <div
                    key={i}
                    className={`adm-room-card${isActive ? " active" : ""}`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="adm-room-id">{room.roomId}</div>
                    <div className="adm-room-meta">
                      <div className="adm-room-row">
                        <span className="adm-room-key">Members</span>
                        <span className="adm-room-val">{room.members?.length ?? 0}</span>
                      </div>
                      <div className="adm-room-row">
                        <span className="adm-room-key">Compat</span>
                        <span className="adm-room-val" style={{ color }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="adm-compat-bar-bg">
                        <div
                          className="adm-compat-bar"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div className="adm-right">
            {!selectedRoom ? (
              <div className="adm-panel-empty">
                <div className="adm-panel-empty-icon">🛏</div>
                <div className="adm-panel-empty-text">
                  Select a room card<br />to view its members
                </div>
              </div>
            ) : (
              <>
                <div className="adm-panel-header">
                  <div className="adm-panel-room-id">{selectedRoom.roomId}</div>
                  <div className="adm-panel-meta">
                    <span className="adm-chip members">
                      {selectedRoom.members?.length} members
                    </span>
                    <span className={`adm-chip ${getCompatClass(selectedRoom.compatibility)}`}>
                      {getCompatPct(selectedRoom.compatibility)}% compat
                    </span>
                  </div>
                </div>

                <div className="adm-members-label">Residents</div>
                <div className="adm-member-list">
                  {selectedRoom.members?.map((m, i) => {
                    const name = getName(m.email);
                    return (
                      <div key={i} className="adm-member-item">
                        <Avatar name={name} index={i} />
                        <div className="adm-member-info">
                          <div className="adm-member-name">{name}</div>
                          <div className="adm-member-email">{m.email}</div>
                        </div>
                        <span className="adm-member-idx">#{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}