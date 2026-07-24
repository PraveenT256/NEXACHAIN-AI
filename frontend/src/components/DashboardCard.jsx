export default function DashboardCard({ label, value, accent }) {
  return (
    <div className="dashboard-card" style={{ borderTopColor: accent }}>
      <p className="dashboard-card-label">{label}</p>
      <p className="dashboard-card-value">{value}</p>
    </div>
  );
}
