"use client";

// Login page. This is an intentionally lightweight demo gate (hardcoded
// credentials, client-side check) — the assignment asks for shareable
// login credentials, not production auth.

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USER = "demo";
const DEMO_PASS = "sheds2026";

export default function Login() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (user.trim() === DEMO_USER && pass === DEMO_PASS) {
      localStorage.setItem("shedclock_auth", "1");
      router.push("/dashboard");
    } else {
      setError("Invalid credentials — see the demo login below.");
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>
          🏗️ Shed<span style={{ color: "var(--accent)" }}>Clock</span>
        </h1>
        <p className="tagline">
          90-day permit renewals &amp; fine exposure for NYC sidewalk sheds —
          live DOB data, built for general contractors.
        </p>

        <div className="field">
          <label htmlFor="user">Username</label>
          <input
            id="user"
            className="input"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="pass">Password</label>
          <input
            id="pass"
            className="input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="btn" style={{ width: "100%" }} type="submit">
          Sign in
        </button>
        {error && <p className="error">{error}</p>}

        <div className="hint">
          Demo login — username <strong>demo</strong>, password{" "}
          <strong>sheds2026</strong>
        </div>
      </form>
    </div>
  );
}
