import { Link } from 'react-router-dom';
import logo from "../assets/logo.png";

function Header() {
  const isLoggedIn = localStorage.getItem('token');
  const role = isLoggedIn ? JSON.parse(atob(isLoggedIn.split('.')[1])).role : null;

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const linkStyle = {
    margin: '0 10px',
    color: '#333',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '600',
    padding: '5px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease',
  };

  const logoutButtonStyle = {
    ...linkStyle,
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <header style={{ padding: '10px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={logo} style={{ height: 50, width: 50 }} alt="logo" />
        <h1 style={{ color: '#dc3545' }}>Bhetiyo</h1>
      </div>

      <nav style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Link to="/" style={linkStyle}>Home</Link>
        <Link to="/lostItems" style={linkStyle}>Lost Items</Link>
        <Link to="/foundItems" style={linkStyle}>Found Items</Link>
        <Link to="/search" style={linkStyle}>Search Items</Link> {/* New link for search */}
        {isLoggedIn && (
          <>
            <Link to="/reportLost" style={linkStyle}>Report Lost</Link>
            <Link to="/reportFound" style={linkStyle}>Report Found</Link>
            <Link to="/myReports" style={linkStyle}>My Reports</Link>
            {role === 'admin' && (
              <>
                <Link to="/admin/users" style={linkStyle}>Admin Users</Link>
                <Link to="/admin/reports" style={linkStyle}>Admin Reports</Link>
              </>
            )}
            <button onClick={logout} style={logoutButtonStyle}>Logout</button>
          </>
        )}
        {!isLoggedIn && (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={linkStyle}>Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;