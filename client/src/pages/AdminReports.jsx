import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReports(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch reports:', err.response?.data?.error || err.message);
      if (err.response?.status === 403) {
        setError('Access Denied: You must be an admin to view this page.');
      } else {
        setError('Failed to fetch reports. Please check your network or server status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (reportId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/reports/${reportId}/claim-status`, { claimStatus: newStatus }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchReports(); // Refresh the list
    } catch (err) {
      alert('Failed to update claim status: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteReport = async (reportId, itemName) => {
    if (window.confirm(`Are you sure you want to delete the report for "${itemName}"?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/admin/reports/${reportId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        alert('Report deleted successfully!');
        fetchReports();
      } catch (err) {
        alert('Failed to delete report: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.reportType === filter;
  });

  const styles = {
    container: { padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' },
    title: { textAlign: 'center', marginBottom: '2rem' },
    filterContainer: { textAlign: 'center', marginBottom: '1.5rem' },
    filterButton: {
      padding: '8px 16px',
      margin: '0 5px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      backgroundColor: '#f8f9fa',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    activeFilterButton: {
      backgroundColor: '#3f892cff',
      color: 'white',
      borderColor: '#3f892cff',
    },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { border: '1px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#f2f2f2' },
    td: { border: '1px solid #ddd', padding: '12px' },
    select: { padding: '5px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '10px' },
    dangerButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '5px'
    },
    error: {
      color: '#dc3545',
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '8px',
      marginTop: '20px'
    },
    similarityCell: {
      fontSize: '12px',
      color: '#6c757d'
    },
    claimedWithoutSearch: {
      color: '#dc3545',
      fontWeight: 'bold'
    },
    tableImage: {
      width: '100px',
      height: '100px',
      objectFit: 'cover',
      margin: '10px',
    },
  };

  if (loading) {
    return <div style={styles.container}><p style={{ textAlign: 'center' }}>Loading reports...</p></div>;
  }

  if (error) {
    return <div style={styles.container}><div style={styles.error}>{error}</div></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin - Manage Reports</h2>
      <div style={styles.filterContainer}>
        <button
          style={{ ...styles.filterButton, ...(filter === 'all' && styles.activeFilterButton) }}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          style={{ ...styles.filterButton, ...(filter === 'lost' && styles.activeFilterButton) }}
          onClick={() => setFilter('lost')}
        >
          Lost Items
        </button>
        <button
          style={{ ...styles.filterButton, ...(filter === 'found' && styles.activeFilterButton) }}
          onClick={() => setFilter('found')}
        >
          Found Items
        </button>
      </div>

      {filteredReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No reports found matching the current filter.
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Item Name</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Posted By</th>
              <th style={styles.th}>Claim Status</th>
              <th style={styles.th}>Claim By</th>
              <th style={styles.th}>Similarity</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map(report => (
              <tr key={report._id}>
                <td style={{...styles.td, ...styles.tableImage}}>
                    {report.image && (
                      <img
                        src={`http://localhost:5000/uploads/${report.image}`}
                        alt={report.itemName}
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    )}
                </td>
                <td style={styles.td}>{report.itemName}</td>
                <td style={styles.td}>{report.reportType}</td>
                <td style={styles.td}>{report.postedBy?.name || 'N/A'}</td>
                <td style={styles.td}>{report.claimStatus}</td>
                <td style={styles.td}>{report.claimBy?.name || 'N/A'}</td>
                <td style={styles.td}>
                  {report.reportType === 'found' && report.claimStatus !== 'none' && typeof report.claimScore === 'number' ? (
                    `${report.claimScore.toFixed(2)}%`
                  ) : (
                    <span style={styles.similarityCell}>
                      {report.reportType === 'found' && report.claimStatus !== 'none' ? 'N/A (Claimed without search)' : '—'}
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {report.reportType === 'found' ? (
                      <select
                        value={report.claimStatus}
                        onChange={(e) => updateClaimStatus(report._id, e.target.value)}
                        style={styles.select}
                      >
                        <option value="none">None</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                      </select>
                    ) : (
                      <select
                        value={report.claimStatus}
                        onChange={(e) => updateClaimStatus(report._id, e.target.value)}
                        style={styles.select}
                      >
                        <option value="not-found-yet">Not Found Yet</option>
                        <option value="has-been-found">Has Been Found</option>
                      </select>
                    )}
                    <button
                      onClick={() => deleteReport(report._id, report.itemName)}
                      style={styles.dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminReports;