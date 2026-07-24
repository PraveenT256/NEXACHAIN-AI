import { useCallback, useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import axiosClient from "../api/axiosClient";
import DashboardCard from "../components/DashboardCard";
import NewInvestmentForm from "../components/NewInvestmentForm";
import ReferralTreeNode from "../components/ReferralTreeNode";

const TABS = ["Overview", "Investments", "ROI History", "Referral Income", "Referral Tree"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  const [summary, setSummary] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [roiHistory, setRoiHistory] = useState([]);
  const [referralIncomeHistory, setReferralIncomeHistory] = useState([]);
  const [referralTree, setReferralTree] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [summaryResponse, investmentsResponse, roiResponse, referralIncomeResponse, referralTreeResponse] =
        await Promise.all([
          axiosClient.get("/dashboard/summary"),
          axiosClient.get("/investments"),
          axiosClient.get("/dashboard/roi-history"),
          axiosClient.get("/dashboard/referral-income-history"),
          axiosClient.get("/referrals/tree"),
        ]);

      setSummary(summaryResponse.data.data);
      setInvestments(investmentsResponse.data.data);
      setRoiHistory(roiResponse.data.data);
      setReferralIncomeHistory(referralIncomeResponse.data.data);
      setReferralTree(referralTreeResponse.data.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const roiChartData = roiHistory
    .slice()
    .reverse()
    .map((record) => ({
      date: new Date(record.date).toLocaleDateString(),
      roi: record.roiAmount,
    }));

  if (isLoading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  if (errorMessage) {
    return <div className="alert-error">{errorMessage}</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-cards-row">
        <DashboardCard label="Total Investments" value={`₹${summary.totalInvestments.toLocaleString()}`} accent="#2f6fed" />
        <DashboardCard label="Today's ROI" value={`₹${summary.todayRoi.toLocaleString()}`} accent="#1fae6b" />
        <DashboardCard label="Total Level Income" value={`₹${summary.totalLevelIncomeEarned.toLocaleString()}`} accent="#e08a1f" />
        <DashboardCard label="Wallet Balance" value={`₹${summary.walletBalance.toLocaleString()}`} accent="#8a3fe0" />
      </div>

      <div className="tabs-row">
        {TABS.map((tabName) => (
          <button
            key={tabName}
            className={`tab-button ${activeTab === tabName ? "tab-button-active" : ""}`}
            onClick={() => setActiveTab(tabName)}
          >
            {tabName}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "Overview" && (
          <div className="overview-tab">
            <div className="chart-container">
              <h3 className="section-title">ROI Earnings Over Time</h3>
              {roiChartData.length === 0 ? (
                <p className="empty-state">No ROI history yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={roiChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="roi" fill="#2f6fed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <NewInvestmentForm onInvestmentCreated={loadDashboardData} />
          </div>
        )}

        {activeTab === "Investments" && (
          <div className="table-wrapper">
            {investments.length === 0 ? (
              <p className="empty-state">No investments yet. Create one from the Overview tab.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Daily ROI %</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => (
                    <tr key={investment._id}>
                      <td>{investment.planName}</td>
                      <td>₹{investment.investmentAmount.toLocaleString()}</td>
                      <td>{investment.dailyRoiPercentage}%</td>
                      <td>{new Date(investment.startDate).toLocaleDateString()}</td>
                      <td>{new Date(investment.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge status-${investment.investmentStatus.toLowerCase()}`}>
                          {investment.investmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "ROI History" && (
          <div className="table-wrapper">
            {roiHistory.length === 0 ? (
              <p className="empty-state">No ROI has been credited yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>ROI Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roiHistory.map((record) => (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.investment?.planName || "-"}</td>
                      <td>₹{record.roiAmount.toLocaleString()}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "Referral Income" && (
          <div className="table-wrapper">
            {referralIncomeHistory.length === 0 ? (
              <p className="empty-state">No referral income yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>From User</th>
                    <th>Level</th>
                    <th>Income Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {referralIncomeHistory.map((record) => (
                    <tr key={record._id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.sourceUser?.fullName || "-"}</td>
                      <td>Level {record.referralLevel}</td>
                      <td>₹{record.incomeAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "Referral Tree" && (
          <div className="referral-tree-wrapper">
            {referralTree.length === 0 ? (
              <p className="empty-state">You have no referrals yet. Share your referral code to get started.</p>
            ) : (
              <ul className="referral-tree-root">
                {referralTree.map((node) => (
                  <ReferralTreeNode key={node._id} node={node} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
