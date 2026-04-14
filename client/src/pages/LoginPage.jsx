import { useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../lib/roles";

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user,
    login,
    signup,
    verifyEmail,
    resendVerification,
  } = useAuth();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [verificationPreview, setVerificationPreview] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const didVerifyRef = useRef(false);
  const roleOptions = mode === "signup" ? ["user", "lender"] : ["user", "lender", "admin"];

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    const token = searchParams.get("verify");
    if (!token || didVerifyRef.current) {
      return;
    }

    didVerifyRef.current = true;

    const runVerification = async () => {
      try {
        setFormLoading(true);
        const res = await verifyEmail(token);
        setMessage(res.msg || "Email verified successfully");
        if (res.user) {
          navigate(getDashboardPath(res.user.role), { replace: true });
        }
      } catch (err) {
        setMessage(err.response?.data?.msg || "Verification failed");
      } finally {
        setFormLoading(false);
      }
    };

    void runVerification();
  }, [navigate, searchParams, verifyEmail]);

  useEffect(() => {
    if (mode === "signup" && role === "admin") {
      setRole("user");
    }
  }, [mode, role]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (mode === "signup" && !form.name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (mode === "signup" && form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (mode === "signup" && form.phone && !/^[0-9+\-\s()]{7,}$/.test(form.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setFormLoading(true);
    setMessage("");
    setVerificationPreview("");

    try {
      if (mode === "signup") {
        const res = await signup({
          ...form,
          role,
        });
        setMessage(res.data.msg);
        setVerificationPreview(res.data.verificationPreviewUrl || "");
        setMode("login");
      } else {
        const session = await login({
          email: form.email,
          password: form.password,
        }, {
          persist: rememberMe,
        });
        navigate(getDashboardPath(session.user.role), { replace: true });
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "Authentication failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setFormLoading(true);
      const res = await resendVerification(form.email);
      setMessage(res.msg);
      setVerificationPreview(res.verificationPreviewUrl || "");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not resend verification");
    } finally {
      setFormLoading(false);
    }
  };

  const loading = formLoading;

  return (
    <div className="app-shell-bg relative min-h-screen overflow-hidden px-6 py-10 text-white">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {[...Array(24)].map((_, index) => (
          <Motion.div
            key={index}
            className="absolute h-2 w-2 rounded-full bg-emerald-300/50"
            animate={{ y: [0, -18, 0], opacity: [0.1, 0.8, 0.1] }}
            transition={{ duration: 6, repeat: Infinity, delay: index * 0.2 }}
            style={{
              top: `${(index * 13) % 100}%`,
              left: `${(index * 17) % 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="app-surface rounded-[34px] p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-blue-200">
            <Sparkles size={14} />
            SmartPark AI
          </div>

          <h1 className="mt-8 max-w-2xl text-5xl font-semibold leading-tight">
            The startup-grade parking intelligence platform for cities, operators, and users.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-[var(--app-text-muted)]">
            Live maps, predictive demand, AI recommendations, smart alerts, business analytics, and role-based operations in one premium product surface.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Mail,
                title: "Fast Sign-In",
                text: "Email and password access in one polished flow.",
              },
              {
                icon: ShieldCheck,
                title: "Operational Control",
                text: "User, lender, and admin flows with intelligent permissions.",
              },
              {
                icon: ArrowRight,
                title: "AI Core",
                text: "Recommendations, demand prediction, and insight generation.",
              },
            ].map((feature) => (
              <div key={feature.title} className="app-card app-card-hover rounded-3xl p-5">
                <feature.icon className="text-blue-200" size={18} />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-[var(--app-text-muted)]">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-surface rounded-[34px] p-8"
        >
          <div className="flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            {["login", "signup"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
                  mode === item ? "bg-white text-slate-950 shadow-[0_8px_24px_rgba(255,255,255,0.18)]" : "text-white/70"
                }`}
              >
                {item === "login" ? "Login" : "Create Account"}
              </button>
            ))}
          </div>

          <div
            className={`mt-6 grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-1 ${
              roleOptions.length === 2 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {roleOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`rounded-2xl px-4 py-3 text-sm ${
                  role === item ? "bg-blue-500 text-white font-semibold shadow-[0_12px_28px_rgba(59,130,246,0.28)]" : "text-white/65"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                <input
                  className="app-input w-full rounded-2xl px-4 py-3"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {fieldErrors.name ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-rose-300">
                    <AlertCircle size={14} />
                    {fieldErrors.name}
                  </p>
                ) : null}
                <input
                  className="app-input w-full rounded-2xl px-4 py-3"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-rose-300">
                    <AlertCircle size={14} />
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </>
            ) : null}

            <input
              className="app-input w-full rounded-2xl px-4 py-3"
              placeholder="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            {fieldErrors.email ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-rose-300">
                <AlertCircle size={14} />
                {fieldErrors.email}
              </p>
            ) : null}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="app-input w-full rounded-2xl px-4 py-3 pr-12"
                placeholder="Password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-rose-300">
                <AlertCircle size={14} />
                {fieldErrors.password}
              </p>
            ) : null}

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border border-white/20 bg-transparent accent-[var(--role-primary)]"
                />
                Remember me
              </span>
              <span className="text-white/45">Session {rememberMe ? "stays on this device" : "ends when the tab closes"}</span>
            </label>

            {message ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                <p>{message}</p>
                {verificationPreview ? (
                  <a className="mt-2 block underline" href={verificationPreview} target="_blank" rel="noreferrer">
                    Open verification preview
                  </a>
                ) : null}
              </div>
            ) : null}

            <button
              disabled={loading}
              className="app-button-primary w-full rounded-2xl px-4 py-3 font-semibold disabled:opacity-60"
            >
              {formLoading
                ? "Working..."
                : mode === "signup"
                ? "Create SmartPark AI Account"
                : "Login"}
            </button>
          </form>
          <button
            type="button"
            disabled={loading || !form.email}
            onClick={handleResend}
            className="app-button-secondary mt-3 w-full rounded-2xl px-4 py-3 text-sm text-white/70"
          >
            Resend verification email
          </button>
        </Motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
