import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../Card';

function LostItems() {
  const [lostReports, setLostReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLostReports = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/public/reports/lost');
        setLostReports(response.data);
      } catch (err) {
        setError('Failed to fetch lost reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchLostReports();
  }, []);

  if (loading) {
    return <div className="container">Loading lost items...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h1>Lost Items</h1>
      {lostReports.length === 0 ? (
        <p>No lost items have been reported yet.</p>
      ) : (
        <div className="cards-container">
          <div className="cards-grid">
            {lostReports.map((report) => (
              <Card key={report._id} report={report} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LostItems;