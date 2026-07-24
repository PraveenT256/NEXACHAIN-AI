import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="app-navbar">
      <Link to="/dashboard" className="app-navbar-brand">
        Nexachain Invest
      </Link>
      {currentUser && (
        <div className="app-navbar-actions">
          <span className="app-navbar-user">
            {currentUser.fullName} · {currentUser.referralCode}
          </span>
          <button className="button-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
