import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../Card';
import { jwtDecode } from 'jwt-decode';

function FoundItems() {
  const [foundReports, setFoundReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFoundReports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/public/reports/found');
      setFoundReports(response.data);
    } catch (err) {
      setError('Failed to fetch found reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoundReports();
  }, []);

  if (loading) {
    return <div className="container">Loading found items...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h1>Found Items</h1>
      {foundReports.length === 0 ? (
        <p>No found items have been reported yet.</p>
      ) : (
        <div className="cards-container">
          <div className="cards-grid">
              {foundReports.map((report) => (
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

export default FoundItems;