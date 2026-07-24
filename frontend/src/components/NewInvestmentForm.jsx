import { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function NewInvestmentForm({ onInvestmentCreated }) {
  const [formData, setFormData] = useState({
    investmentAmount: "",
    planName: "Growth Plan",
    planDurationInDays: 30,
    dailyRoiPercentage: 1,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await axiosClient.post("/investments", {
        ...formData,
        investmentAmount: Number(formData.investmentAmount),
        planDurationInDays: Number(formData.planDurationInDays),
        dailyRoiPercentage: Number(formData.dailyRoiPercentage),
      });
      setFormData({ investmentAmount: "", planName: "Growth Plan", planDurationInDays: 30, dailyRoiPercentage: 1 });
      onInvestmentCreated();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not create investment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="new-investment-form" onSubmit={handleSubmit}>
      <h3 className="section-title">New Investment</h3>
      {errorMessage && <div className="alert-error">{errorMessage}</div>}
      <div className="form-grid">
        <div>
          <label className="form-label" htmlFor="investmentAmount">
            Amount
          </label>
          <input
            id="investmentAmount"
            name="investmentAmount"
            type="number"
            min="1"
            className="form-input"
            value={formData.investmentAmount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label" htmlFor="planName">
            Plan
          </label>
          <input
            id="planName"
            name="planName"
            className="form-input"
            value={formData.planName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label" htmlFor="planDurationInDays">
            Duration (days)
          </label>
          <input
            id="planDurationInDays"
            name="planDurationInDays"
            type="number"
            min="1"
            className="form-input"
            value={formData.planDurationInDays}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="form-label" htmlFor="dailyRoiPercentage">
            Daily ROI %
          </label>
          <input
            id="dailyRoiPercentage"
            name="dailyRoiPercentage"
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={formData.dailyRoiPercentage}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <button className="button-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Create Investment"}
      </button>
    </form>
  );
}
