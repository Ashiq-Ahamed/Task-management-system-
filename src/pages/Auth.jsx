import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input } from "../components/UI";
import "./Auth.css";

/* =========================================
   LOGIN PAGE
========================================= */
export const LoginPage = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (success) setSuccess("");

    setLoading(true);

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      const result = await login(payload);
      if (!result.success) throw new Error(result.message);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="auth-logo">✔</div>
          <span className="auth-brand-name">TaskFlow</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Login</h1>
            <p className="auth-subtitle">Sign in to your workspace</p>
          </div>

          {success && <div className="auth-alert success">{success}</div>}
          {error && <div className="auth-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              endIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.72-2.03 1.9-3.81 3.4-5.2" />
                      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                      <path d="M1 1l22 22" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              }
              onEndIconClick={() => setShowPassword((prev) => !prev)}
              endIconLabel={showPassword ? "Hide password" : "Show password"}
              required
            />

            <Button type="submit" variant="primary" size="lg" loading={loading}>Sign In</Button>
          </form>

          <p className="auth-footer-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
/* =========================================
   REGISTER PAGE
========================================= */
export const RegisterPage = () => {
  const { register } = useAuth();   // ✅ USE REGISTER NOT LOGIN
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    setLoading(true);

    try {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
      };

      // ✅ Call register function from AuthContext
      const result = await register(payload);

      if (!result.success) {
        throw new Error(result.message || "Registration failed");
      }

      // ✅ Redirect after successful registration
      navigate("/login", { state: { message: "Account created successfully! Please sign in." } });
    } catch (err) {
      console.error("Register error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="auth-logo">✔</div>
          <span className="auth-brand-name">TaskFlow</span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join your team's workspace</p>
          </div>

          {error && <div className="auth-alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Contact"
              type="text"
              name="contact"
              value={form.contact}
              onChange={handleChange}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              endIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.72-2.03 1.9-3.81 3.4-5.2" />
                      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                      <path d="M1 1l22 22" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              }
              onEndIconClick={() => setShowPassword((prev) => !prev)}
              endIconLabel={showPassword ? "Hide password" : "Show password"}
              required
            />

            <Button type="submit" variant="primary" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
