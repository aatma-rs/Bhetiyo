import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Card.css';
import { jwtDecode } from 'jwt-decode';

function getUserIdFromToken() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.userId;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }
  return null;
}

function Card({ report }) {
  const [claimMessage, setClaimMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const loggedInUserId = getUserIdFromToken();

  const handleClaim = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setClaimMessage('Please login to claim items');
      return;
    }

    setLoading(true);
    setClaimMessage('Submitting claim...');

    try {
      await axios.post(
        `http://localhost:5000/api/reports/${report._id}/claim`,
        { claimScore: 0 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setClaimMessage('Claim submitted successfully! Wait for Admin Approval or contact Admin: +977-9841234567');
    } catch (err) {
      setClaimMessage(err.response?.data?.error || 'Failed to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = report.image
    ? `http://localhost:5000/uploads/${report.image}`
    : 'https://via.placeholder.com/150';

  const shouldShowClaimButton = 
    report.reportType === 'found' && 
    loggedInUserId && 
    report.postedBy?._id !== loggedInUserId &&
    report.claimStatus === 'none';

  const showPostedByYou =
    report.reportType === 'found' &&
    loggedInUserId &&
    report.postedBy?._id == loggedInUserId;

  const showLostPostedByYou =
    report.reportType === 'lost' &&
    loggedInUserId &&
    report.postedBy?._id == loggedInUserId;

  return (
    <div className="card">
      <img src={imageUrl} alt={report.itemName} className="card-image" />
      <div className="card-body">
        <h3 className="card-title">{report.itemName}</h3>
        <p>
          <span className="report-label">Report Type:</span>
          <span className={`badge ${report.reportType === 'lost' ? 'badge-lost' : 'badge-found'}`}>
            {report.reportType}
          </span>
        </p>
        <p><strong>Location:</strong> {report.location}</p>
        <p><strong>Date:</strong> {new Date(report.date).toLocaleDateString()}</p>
        <p><strong>Posted by:</strong> {report.userName}</p>
        <p><strong>Description:</strong> {report.description}</p>
        <p style={{ marginBottom: '20px'}}>
          <span className="report-label">Status:</span>
            <span className={`badge badge-status-${report.claimStatus}`}>
              {report.reportType === 'lost'
                ? report.claimStatus === 'not-found-yet'
                  ? 'Not Found Yet'
                  : 'Has Been Found'
                : report.claimStatus}
            </span>
        </p>
        
        {shouldShowClaimButton && (
          <button className="btn btn-primary" onClick={handleClaim} disabled={loading}>
            {loading ? 'Submitting...' : 'Claim This Item'}
          </button>
        )}

        {showPostedByYou && (
          <p style={{ color: 'green', fontWeight: 'bold', marginTop: 'auto', marginBottom: '30px'}}>
            You Posted This as Found
          </p>
        )}

        {showLostPostedByYou && (
          <p style={{ color: 'red', fontWeight: 'bold', marginTop: 'auto', marginBottom: '30px'}}>
            You Posted This as Lost
          </p>
        )}

        {claimMessage && (
          <div className="claim-message" style={{ color: claimMessage.includes('successfully') ? 'green' : 'red', marginBottom: '20px' }}>
            {claimMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export function CardsContainer() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/public/reports/all');
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports. Please check your server.');
    } finally {
      setLoading(false);
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
        <p className="error-message">Error: {error}</p>
        <button onClick={fetchReports} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="cards-container">
      {reports.length === 0 ? (
        <div className="no-reports">
          <p>No reports found.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {reports.map((report) => (
            <Card key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Card;