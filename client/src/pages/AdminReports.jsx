import React, { useState, useEffect } from 'react';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateClaimStatus = async (reportId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/claim-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ claimStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update claim status');
      }

      fetchReports();
      alert('Claim status updated successfully!');
    } catch (err) {
      alert('Error updating claim status: ' + err.message);
    }
  };

  const deleteReport = async (reportId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete the report for "${itemName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      fetchReports();
      alert('Report deleted successfully!');
    } catch (err) {
      alert('Error deleting report: ' + err.message);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'lost' || filter === 'found') return report.reportType === filter;
    if (filter === 'pending' || filter === 'approved') return report.claimStatus === filter;
    return true;
  });

  const containerStyle = {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const filterStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  };

  const filterButtonStyle = {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#fff'
  };

  const activeFilterStyle = {
    ...filterButtonStyle,
    backgroundColor: '#dc3545',
    color: '#fff',
    borderColor: '#dc3545'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const thStyle = {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '14px'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
    verticalAlign: 'top'
  };

  const buttonStyle = {
    padding: '4px 8px',
    margin: '2px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: '#fff'
  };

  const selectStyle = {
    padding: '4px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '4px'
  };

  const badgeStyle = {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  };

  const getBadgeStyle = (type, value) => {
    const baseStyle = { ...badgeStyle };
    
    if (type === 'reportType') {
      return {
        ...baseStyle,
        backgroundColor: value === 'lost' ? '#ffc107' : '#17a2b8',
        color: '#fff'
      };
    }
    
    if (type === 'claimStatus') {
      switch (value) {
        case 'none':
          return { ...baseStyle, backgroundColor: '#6c757d', color: '#fff' };
        case 'pending':
          return { ...baseStyle, backgroundColor: '#ffc107', color: '#000' };
        case 'approved':
          return { ...baseStyle, backgroundColor: '#28a745', color: '#fff' };
        default:
          return { ...baseStyle, backgroundColor: '#6c757d', color: '#fff' };
      }
    }
    
    return baseStyle;
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <h2>Admin - Reports Management</h2>
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h2>Admin - Reports Management</h2>
        <p style={{ color: '#dc3545' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ color: '#dc3545', marginBottom: '10px' }}>Admin - Reports Management</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Total Reports: {reports.length} | Showing: {filteredReports.length}
      </p>

      <div style={filterStyle}>
        <button
          onClick={() => setFilter('all')}
          style={filter === 'all' ? activeFilterStyle : filterButtonStyle}
        >
          All Reports
        </button>
        <button
          onClick={() => setFilter('lost')}
          style={filter === 'lost' ? activeFilterStyle : filterButtonStyle}
        >
          Lost Items
        </button>
        <button
          onClick={() => setFilter('found')}
          style={filter === 'found' ? activeFilterStyle : filterButtonStyle}
        >
          Found Items
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={filter === 'pending' ? activeFilterStyle : filterButtonStyle}
        >
          Pending Claims
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={filter === 'approved' ? activeFilterStyle : filterButtonStyle}
        >
          Approved Claims
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Item</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Posted By</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Claim Status</th>
              <th style={thStyle}>Claimed By</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map(report => (
              <tr key={report._id}>
                <td style={tdStyle}>
                  <strong>{report.itemName}</strong>
                </td>
                <td style={tdStyle}>
                  <span style={getBadgeStyle('reportType', report.reportType)}>
                    {report.reportType}
                  </span>
                </td>
                <td style={tdStyle}>{report.location}</td>
                <td style={tdStyle}>
                  {new Date(report.date).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <div>
                    <strong>{report.postedBy?.name || 'Unknown'}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      {report.postedBy?.email || 'N/A'}
                    </small>
                  </div>
                </td>
                <td style={tdStyle}>{report.contact}</td>
                <td style={tdStyle}>
                  <span style={getBadgeStyle('claimStatus', report.claimStatus)}>
                    {report.claimStatus}
                  </span>
                </td>
                <td style={tdStyle}>
                  {report.claimBy ? (
                    <div>
                      <strong>{report.claimBy.name}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        {report.claimBy.email}
                      </small>
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>No claims</span>
                  )}
                </td>
                <td style={{ ...tdStyle, maxWidth: '200px' }}>
                  <div style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {report.description}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* Conditional rendering for claim status select */}
                    {report.reportType === 'found' && report.claimBy ? (
                      <select
                        value={report.claimStatus}
                        onChange={(e) => updateClaimStatus(report._id, e.target.value)}
                        style={selectStyle}
                      >
                        <option value="none">No Claims</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                      </select>
                    ) : (report.reportType === 'lost' || !report.claimBy) && (
                      <span style={{ color: '#999', fontSize: '12px' }}>N/A</span>
                    )}
                    <button
                      onClick={() => deleteReport(report._id, report.itemName)}
                      style={dangerButtonStyle}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredReports.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <p>No reports found matching the current filter.</p>
        </div>
      )}
    </div>
  );
}

export default AdminReports;