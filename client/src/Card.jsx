import React, { useState, useEffect } from 'react';
import defaultImage from "../src/assets/walletdemo.webp";

function Card({ report, onClaim }) {
  const handleClaim = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to claim items');
      return;
    }
    onClaim(report._id);
  };

  const getStatusBadge = (status) => {
    const badgeStyles = {
      none: { backgroundColor: '#6c757d', color: '#fff' },
      pending: { backgroundColor: '#ffc107', color: '#000' },
      approved: { backgroundColor: '#28a745', color: '#fff' }
    };

    return (
      <span 
        className="status-badge"
        style={{
          ...badgeStyles[status] || badgeStyles.none,
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}
      >
        {status === 'none' ? 'Available' : status}
      </span>
    );
  };

  const getTypeStyle = (type) => ({
    backgroundColor: type === 'lost' ? '#ffc107' : '#17a2b8',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  });

  return (
    <div className="card">
      {/* <img 
        src={report.imageUrl || defaultImage} 
        alt={`${report.itemName} Picture`} 
        className="cardPicture" 
      /> */}
      <div className="card-header">
        <h2 className="cardTitle">{report.itemName}</h2>
        <div className="card-badges">
          <span style={getTypeStyle(report.reportType)}>
            {report.reportType}
          </span>
          {getStatusBadge(report.claimStatus)}
        </div>
      </div>
      
      <div className="card-info">
        <p className="card-location">
          <strong>Location:</strong> {report.location}
        </p>
        <p className="card-date">
          <strong>Date:</strong> {new Date(report.date).toLocaleDateString()}
        </p>
        <p className="card-contact">
          <strong>Contact:</strong> {report.contact}
        </p>
        <p className="card-posted-by">
          <strong>Posted by:</strong> {report.postedBy?.name || report.userName || 'Anonymous'}
        </p>
      </div>
      
      <p className="cardDescription">{report.description}</p>
      
      {report.reportType === 'found' && report.claimStatus === 'none' && (
        <button 
          className="claim-button"
          onClick={handleClaim}
          style={{
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            marginTop: '10px',
            width: '100%'
          }}
        >
          Claim This Item
        </button>
      )}
    </div>
  );
}


function CardsContainer({ reportType = 'all' }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let url;
      
      switch (reportType) {
        case 'lost':
          url = 'http://localhost:5000/api/reports/lost';
          break;
        case 'found':
          url = 'http://localhost:5000/api/reports/found';
          break;
        default:

          const [lostResponse, foundResponse] = await Promise.all([
            fetch('http://localhost:5000/api/reports/lost'),
            fetch('http://localhost:5000/api/reports/found')
          ]);
          
          if (!lostResponse.ok || !foundResponse.ok) {
            throw new Error('Failed to fetch reports');
          }
          
          const lostData = await lostResponse.json();
          const foundData = await foundResponse.json();
          const combinedData = [...lostData, ...foundData]
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
          
          setReports(combinedData);
          setLoading(false);
          return;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim item');
      }

      alert('Claim request submitted successfully!');
      fetchReports();
    } catch (err) {
      alert('Error claiming item: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="cards-container">
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cards-container">
        <p style={{ color: '#dc3545' }}>Error: {error}</p>
        <button onClick={fetchReports} style={{ marginTop: '10px' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="cards-container">
      {reports.length === 0 ? (
        <div className="no-reports">
          <p>No {reportType === 'all' ? '' : reportType} reports found.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {reports.map(report => (
            <Card 
              key={report._id} 
              report={report} 
              onClaim={handleClaim}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { Card, CardsContainer };
export default CardsContainer;