import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Login() {
  const [phone, setPhone] = useState("+220 777 4021");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [devHint, setDevHint] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      const res = await api.requestOtp(phone);
      setDevHint(res.devHint);
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError("");
    try {
      const res = await api.verifyOtp(phone, code);
      api.setToken(res.token);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 380 }}>
      <h2 className="display">Sign in</h2>
      <p style={{ color: "var(--ink-dim)", fontSize: 13 }}>We'll text you a one-time code, no password needed.</p>

      {error && <div className="error-banner">{error}</div>}

      {step === "phone" ? (
        <>
          <div className="field">
            <label>Mobile number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={sendCode} disabled={loading}>
            {loading ? "Sending..." : "Send code"}
          </button>
        </>
      ) : (
        <>
          {devHint && (
            <div className="badge" style={{ marginBottom: 12 }}>
              Dev mode: code is {devHint}
            </div>
          )}
          <div className="field">
            <label>6-digit code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
          </div>
          <button className="btn btn-primary" onClick={verify} disabled={loading || code.length !== 6}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </>
      )}
    </div>
  );
}
