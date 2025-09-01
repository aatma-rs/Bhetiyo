import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../Card';

function MyReports() {
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyReports = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your reports.');
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get('http://localhost:5000/api/reports/my', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setMyReports(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch your reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyReports();
  }, []);

  if (loading) {
    return <div className="container">Loading your reports...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h1>My Reports</h1>
      {myReports.length === 0 ? (
        <p>You have not submitted any reports yet.</p>
      ) : (
        <div className="cards-container">
          <div className="cards-grid">
            {myReports.map((report) => (
                <Card
                  key={report._id}
                  report={report}
                />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReports;