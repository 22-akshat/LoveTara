import React, { useState } from "react";

interface LoginProps {
    onSuccess: (username: string) => void;
}

// Demo credentials (client-side check only)
const DEMO_USERNAME = "AkshatAnjali";
const DEMO_PASSWORD = "22120605";

export default function Login({ onSuccess }: LoginProps) {
    const [u, setU] = useState("");
    const [p, setP] = useState("");
    const [show, setShow] = useState(false);
    const [err, setErr] = useState("");

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        if (u === DEMO_USERNAME && p === DEMO_PASSWORD) {
            onSuccess(u);
        } else {
            setErr("Galat username ya password. Please try again ✨");
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                background:
                    "radial-gradient(1200px 700px at 50% 25%, rgba(124,123,255,.12), transparent 60%), linear-gradient(180deg, #0A0F1F 0%, #121832 60%, #121832 100%)",
                color: "#E9ECF5",
                padding: "24px",
            }}
        >
            <form
                onSubmit={submit}
                style={{
                    width: "100%",
                    maxWidth: 420,
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,.08)",
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
                    backdropFilter: "saturate(140%) blur(8px)",
                    padding: "28px",
                    boxShadow:
                        "0 10px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06)",
                }}
            >
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                        Welcome back 👋
                    </h1>
                    <p style={{ margin: "6px 0 0", opacity: 0.85, fontSize: 14 }}>
                        Please sign in to continue
                    </p>
                </div>

                <label style={{ display: "block", fontSize: 13, marginTop: 8 }}>
                    Username
                </label>
                <input
                    value={u}
                    onChange={(e) => setU(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter username"
                    style={inputStyle}
                />

                <label style={{ display: "block", fontSize: 13, marginTop: 12 }}>
                    Password
                </label>
                <div style={{ position: "relative" }}>
                    <input
                        value={p}
                        onChange={(e) => setP(e.target.value)}
                        type={show ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter password"
                        style={{ ...inputStyle, paddingRight: 96 }}
                    />
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        style={{ ...btnStyle, position: "absolute", right: 6, top: 6 }}
                    >
                        {show ? "Hide" : "Show"}
                    </button>
                </div>

                {err && (
                    <p style={{ color: "#ff9aa2", fontSize: 12, marginTop: 8 }}>{err}</p>
                )}

                <button type="submit" style={{ ...btnStyle, width: "100%", marginTop: 14, background: "#7C7BFF", border: "none" }}>
                    Sign In
                </button>

                {/* Demo hint (optional) */}
                <p style={{ fontSize: 11, opacity: 0.65, marginTop: 10, textAlign: "center" }}>
                    {/* Demo creds — <b>{DEMO_USERNAME}</b> / <b>{DEMO_PASSWORD}</b> */}
                </p>
            </form>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    padding: "12px 14px",
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.12)",
    color: "#fff",
    outline: "none",
    marginTop: 6,
};

const btnStyle: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
    backdropFilter: "saturate(140%) blur(8px)",
};
