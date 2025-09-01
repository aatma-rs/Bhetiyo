import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const [isReportingDropdownOpen, setIsReportingDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  
  const isLoggedIn = localStorage.getItem('token');
  const role = isLoggedIn ? JSON.parse(atob(isLoggedIn.split('.')[1])).role : null;

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const closeAllDropdowns = () => {
    setIsItemsDropdownOpen(false);
    setIsReportingDropdownOpen(false);
    setIsAdminDropdownOpen(false);
  };

  const toggleDropdown = (setter) => (e) => {
    e.preventDefault();
    setter(prev => !prev);
  };

  return (
    <header className="header">
      <div className="header-logo">
        <img src="http://localhost:5000/uploads/logo.png" alt="logo" />
        <h1 className="header-title">Bhetiyo</h1>
      </div>

      <nav className="header-nav">
        <Link to="/" className="nav-link" onClick={closeAllDropdowns}>Home</Link>
        
        <div 
          className="dropdown"
          onMouseEnter={() => setIsItemsDropdownOpen(true)}
          onMouseLeave={() => setIsItemsDropdownOpen(false)}
        >
          <Link to="#" className="nav-link">Items</Link>
          <div className="dropdown-content" style={{ display: isItemsDropdownOpen ? 'block' : 'none' }}>
            <Link to="/lostItems" onClick={closeAllDropdowns}>Lost Items</Link>
            <Link to="/foundItems" onClick={closeAllDropdowns}>Found Items</Link>
          </div>
        </div>

        <Link to="/search" className="nav-link" onClick={closeAllDropdowns}>Search Items</Link>

        {isLoggedIn && (
          <>
            <div 
              className="dropdown"
              onMouseEnter={() => setIsReportingDropdownOpen(true)}
              onMouseLeave={() => setIsReportingDropdownOpen(false)}
            >
              <Link to="#" className="nav-link">Report</Link>
              <div className="dropdown-content" style={{ display: isReportingDropdownOpen ? 'block' : 'none' }}>
                <Link to="/reportLost" onClick={closeAllDropdowns}>Report Lost</Link>
                <Link to="/reportFound" onClick={closeAllDropdowns}>Report Found</Link>
              </div>
            </div>
            <Link to="/myReports" className="nav-link" onClick={closeAllDropdowns}>My Reports</Link>
            {role === 'admin' && (
              <div 
                className="dropdown"
                onMouseEnter={() => setIsAdminDropdownOpen(true)}
                onMouseLeave={() => setIsAdminDropdownOpen(false)}
              >
                <Link to="#" className="nav-link">Admin</Link>
                <div className="dropdown-content" style={{ display: isAdminDropdownOpen ? 'block' : 'none' }}>
                  <Link to="/admin/users" onClick={closeAllDropdowns}>Admin Users</Link>
                  <Link to="/admin/reports" onClick={closeAllDropdowns}>Admin Reports</Link>
                </div>
              </div>
            )}
            <button onClick={logout} className="btn-logout">Logout</button>
          </>
        )}
        
        {!isLoggedIn && (
          <>
            <Link to="/login" className="nav-link" onClick={closeAllDropdowns}>Login</Link>
            <Link to="/register" className="nav-link" onClick={closeAllDropdowns}>Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;