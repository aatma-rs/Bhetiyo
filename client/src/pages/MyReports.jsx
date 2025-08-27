import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchMyReports();
  }, [navigate]);

  async function fetchMyReports() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/reports/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReports(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('Please log in to view your reports.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage('Failed to fetch your reports.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusColor(status) {
    switch (status) {
      case 'none': return '#6c757d';
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      default: return '#6c757d';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'none': return 'No Claims';
      case 'pending': return 'Claim Pending';
      case 'approved': return 'Claim Approved';
      default: return 'Unknown';
    }
  }

  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '1000px',
      margin: '0 auto'
    },
    title: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#333'
    },
    message: {
      textAlign: 'center',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '20px',
      backgroundColor: '#f8d7da',
      color: '#721c24'
    },
    loadingText: {
      textAlign: 'center',
      fontSize: '18px',
      color: '#666'
    },
    noReports: {
      textAlign: 'center',
      fontSize: '18px',
      color: '#666',
      padding: '40px'
    },
    reportsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px'
    },
    reportCard: {
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #ddd'
    },
    reportHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    },
    reportType: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    },
    lostType: {
      backgroundColor: '#dc3545',
      color: 'white'
    },
    foundType: {
      backgroundColor: '#28a745',
      color: 'white'
    },
    itemName: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '10px'
    },
    reportDetail: {
      marginBottom: '8px',
      color: '#666'
    },
    reportLabel: {
      fontWeight: 'bold',
      color: '#333'
    },
    description: {
      backgroundColor: '#fff',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      marginTop: '10px',
      fontSize: '14px',
      lineHeight: '1.4'
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginTop: '10px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading your reports...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Reports</h2>
      
      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {reports.length === 0 ? (
        <div style={styles.noReports}>
          <p>You haven't submitted any reports yet.</p>
          <p>Start by reporting a <a href="/report-lost">lost item</a> or <a href="/report-found">found item</a>.</p>
        </div>
      ) : (
        <div style={styles.reportsGrid}>
          {reports.map((report) => (
            <div key={report._id} style={styles.reportCard}>
              <div style={styles.reportHeader}>
                <span 
                  style={{
                    ...styles.reportType,
                    ...(report.reportType === 'lost' ? styles.lostType : styles.foundType)
                  }}
                >
                  {report.reportType}
                </span>
                <small style={{ color: '#666' }}>
                  {formatDate(report.createdAt)}
                </small>
              </div>
              
              <div style={styles.itemName}>{report.itemName}</div>
              
              <div style={styles.reportDetail}>
                <span style={styles.reportLabel}>Location: </span>
                {report.location}
              </div>
              
              <div style={styles.reportDetail}>
                <span style={styles.reportLabel}>Date: </span>
                {formatDate(report.date)}
              </div>
              
              <div style={styles.reportDetail}>
                <span style={styles.reportLabel}>Contact: </span>
                {report.contact}
              </div>
              
              {report.description && (
                <div style={styles.description}>
                  <strong>Description:</strong><br />
                  {report.description}
                </div>
              )}
              
              <div 
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(report.claimStatus)
                }}
              >
                {getStatusText(report.claimStatus)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyReports;