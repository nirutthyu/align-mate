import React, { useState } from "react";
import Home from "./Home";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("main");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  if (page === "dashboard" && isAdminLoggedIn) {
    return <AdminDashboard />;
  }

  if (page === "student") {
    return <Home setPage={setPage} />;
  }

  if (page === "admin") {
    return (
      <AdminLogin
        setIsAdminLoggedIn={setIsAdminLoggedIn}
        setPage={setPage}
      />
    );
  }

  return (
    <div className="app-root">

      {/* Background decoration */}
      <div className="app-bg-circle one" />
      <div className="app-bg-circle two" />

      {/* Top bar */}
      <header className="app-topbar">
        <div className="app-logo">
          <div className="app-logo-mark">🏠</div>
          <div>
            <div className="app-logo-name">AlignMate</div>
            <div className="app-logo-tag">Hostel Roommate System</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">

        {/* ── Left: Hero ── */}
        <section className="app-hero">
          <div className="app-eyebrow">
            <span className="app-eyebrow-line" />
            <span className="app-eyebrow-text">Smart Room Assignment</span>
          </div>

          <h1 className="app-headline">
            Find your
            <span className="app-headline-accent">perfect</span>
            roommate.
          </h1>

          <p className="app-desc">
            Answer a few questions about your lifestyle and preferences.
            Our algorithm matches you with the most compatible roommate in your hostel.
          </p>

          <div className="app-actions">
            <button className="app-btn student" onClick={() => setPage("student")}>
              <div>
                Student Login
                <span className="app-btn-sub">Fill your preference form</span>
              </div>
              <span className="app-btn-arrow">→</span>
            </button>

            <button className="app-btn admin" onClick={() => setPage("admin")}>
              <div>
                Admin Login
                <span className="app-btn-sub">View & manage assignments</span>
              </div>
              <span className="app-btn-arrow">→</span>
            </button>
          </div>
        </section>

        {/* ── Right: Visual ── */}
        <section className="app-visual">
          <div className="app-visual-grid" />

          {/* Floating card stack */}
          <div className="app-card-stack">

            {/* Back cards (decorative) */}
            <div className="app-card back-2" />
            <div className="app-card back-1" />

            {/* Front card */}
            <div className="app-card front">
              <div className="app-card-top">
                <div className="app-card-avatar">👤</div>
                <div>
                  <div className="app-card-name">Arjun S.</div>
                  <div className="app-card-tag">Room 204 · Block B</div>
                </div>
              </div>

              <div className="app-card-divider" />

              <div className="app-card-row">
                <span className="app-card-label">Sleep Schedule</span>
                <span className="app-card-value">11 pm – 7 am</span>
              </div>
              <div className="app-card-row">
                <span className="app-card-label">Study Style</span>
                <span className="app-card-value">Silent</span>
              </div>
              <div className="app-card-row">
                <span className="app-card-label">Cleanliness</span>
                <span className="app-card-value">Very tidy</span>
              </div>
              <div className="app-card-row">
                <span className="app-card-label">Social Level</span>
                <span className="app-card-value">Introvert</span>
              </div>
            </div>
          </div>
  
        </section>

      </main>
    </div>
  );
}