import { useState } from "react";

import Login from "./components/Login";
import LoveGalleryApp from "./components/LoveGalleryApp";

const SESSION_KEY = "lg.session.user";

export default function App() {
  // Read existing session from localStorage on first render
  const [user, setUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      // ignore storage read errors
      return null;
    }
  });

  const handleSuccess = (username: string) => {
    setUser(username);
    try {
      localStorage.setItem(SESSION_KEY, username);
    } catch {
      // ignore storage write errors
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore storage remove errors
    }
  };

  // 🔐 Always show Login first; proceed only after success
  if (!user) {
    return <Login onSuccess={handleSuccess} />;
  }

  return <MainApp onLogout={handleLogout} />;
}

// Main app after login
function MainApp({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      style={{
        background:
          "radial-gradient(1200px 700px at 50% 25%, rgba(124,123,255,.12), transparent 60%), linear-gradient(180deg, #0A0F1F 0%, #121832 60%, #121832 100%)",
        minHeight: "100vh",
        color: "#E9ECF5",
      }}
    >
      <LoveGalleryApp />

      {/* Single Logout button (fixed top-right) */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          padding: "16px",
          zIndex: 60,
        }}
      >
        <button
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
          style={{
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.10)",
            background: "rgba(255,255,255,.06)",
            color: "#fff",
            padding: "10px 14px",
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "saturate(140%) blur(8px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,.10)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,.06)";
          }}
        >
          Logout
        </button>
      </nav>
    </div>
  );
}
