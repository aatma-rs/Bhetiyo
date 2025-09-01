import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users:', err.response?.data?.error || err.message);
      if (err.response?.status === 403) {
        setError('Access Denied: You must be an admin to view this page.');
      } else {
        setError('Failed to fetch users. Please check your network or server status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/role`, { role: newRole }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user role: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user: ${userName}?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        alert('User deleted successfully!');
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const styles = {
    container: { padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' },
    title: { textAlign: 'center', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2' },
    td: { border: '1px solid #ddd', padding: '12px' },
    adminBadge: { backgroundColor: '#b9313fff', color: 'white', padding: '4px 8px', borderRadius: '12px' },
    userBadge: { backgroundColor: '#6c757d', color: 'white', padding: '4px 8px', borderRadius: '12px' },
    select: { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '10px' },
    dangerButton: {
      backgroundColor: '#b9313fff',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    error: {
      color: '#b9313fff',
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '8px',
      marginTop: '20px'
    }
  };

  if (loading) {
    return <div style={styles.container}><p style={{ textAlign: 'center' }}>Loading users...</p></div>;
  }

  if (error) {
    return <div style={styles.container}><div style={styles.error}>{error}</div></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin - Manage Users</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Contact</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Registered On</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td style={styles.td}>{user.name}</td>
              <td style={styles.td}>{user.email}</td>
              <td style={styles.td}>{user.contact}</td>
              <td style={styles.td}>
                <span style={user.role === 'admin' ? styles.adminBadge : styles.userBadge}>
                  {user.role}
                </span>
              </td>
              <td style={styles.td}>
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td style={styles.td}>
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user._id, e.target.value)}
                  style={styles.select}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => deleteUser(user._id, user.name)}
                  style={styles.dangerButton}
                  title="Delete User"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No users found.
        </div>
      )}
    </div>
  );
}

export default AdminUsers;