import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    password: "",
    referralCode: searchParams.get("ref") || "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await axiosClient.post("/auth/register", formData);
      const { token, user } = response.data.data;
      loginWithCredentials(token, user);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start investing and earning referral income</p>

        {errorMessage && <div className="alert-error">{errorMessage}</div>}

        <label className="form-label" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          className="form-input"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <label className="form-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-input"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label className="form-label" htmlFor="mobileNumber">
          Mobile number
        </label>
        <input
          id="mobileNumber"
          name="mobileNumber"
          className="form-input"
          value={formData.mobileNumber}
          onChange={handleChange}
          required
        />

        <label className="form-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-input"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
        />

        <label className="form-label" htmlFor="referralCode">
          Referral code (optional)
        </label>
        <input
          id="referralCode"
          name="referralCode"
          className="form-input"
          value={formData.referralCode}
          onChange={handleChange}
        />

        <button className="button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
