import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Card from '../Card';

function SearchItems() {
  const [searchQuery, setSearchQuery] = useState({
    description: '',
  });
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(decodedToken.userId);
    } catch (e) {
      console.error("Error decoding token:", e);
      navigate('/login');
    }
  }, [navigate]);

  function handleChange(e) {
    setSearchQuery(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setResults([]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(searchQuery.description)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.length === 0) {
        setMessage('No matching items found.');
      }
      setResults(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to perform search. Please try again.';
      setMessage(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleClaim = async (foundReportId, score) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setClaimMessage(prev => ({ ...prev, [foundReportId]: { text: 'You must be logged in to claim an item.', type: 'error' } }));
      return;
    }

    setClaimMessage(prev => ({ ...prev, [foundReportId]: { text: 'Claiming...', type: 'info' } }));

    try {
      const response = await axios.post(`http://localhost:5000/api/reports/${foundReportId}/claim`, { claimScore: score }, { // Sending score in the body
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClaimMessage(prev => ({ ...prev, [foundReportId]: { text: 'Claim submitted successfully! Wait for Admin Approval or contact Admin: +977-9841234567', type: 'success' } }));

      setResults(prevResults =>
        prevResults.map(result =>
          result.report._id === foundReportId
            ? { ...result, report: { ...result.report, claimStatus: 'pending', claimBy: currentUserId } }
            : result
        )
      );
    } catch (err) {
      const errorText = err.response?.data?.error || 'Failed to submit claim. Please try again.';
      setClaimMessage(prev => ({ ...prev, [foundReportId]: { text: errorText, type: 'error' } }));
      console.error("Error submitting claim:", err);
    }
  };

  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    },
    title: {
      textAlign: 'center',
      marginBottom: '20px',
      color: '#252525ff'
    },
    form: {
      display: 'flex',
      gap: '10px',
      marginBottom: '30px'
    },
    input: {
      flexGrow: 1,
      padding: '20px',
      fontSize: '16px',
      borderRadius: '4px',
      border: '1px solid #ccc'
    },
    button: {
      padding: '10px 40px',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#fff',
      backgroundColor: '#252525ff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    message: {
      padding: '15px',
      borderRadius: '8px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      textAlign: 'center',
      border: '1px solid #f5c6cb'
    },
    list: {
      listStyleType: 'none',
      padding: 0
    },
    card: {
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '15px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      display: 'flex',
      gap: '20px'
    },
    imageContainer: {
      minWidth: '300px',
      minHeight: '300px',
      maxWidth: '300px',
      maxHeight: '300px',
      marginBottom: '15px',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    noImageText: {
      color: '#888',
      fontSize: '14px',
      fontStyle: 'italic',
    },
    reportTypeBadge: (type) => ({
      backgroundColor: type === 'lost' ? '#b9313fff' : '#3f892cff',
      color: '#fff',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    }),
    claimButton: {
      backgroundColor: '#3f892cff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      marginTop: '10px',
      fontSize: '16px'
    },
    claimedButton: {
      backgroundColor: '#ffd900ff',
      color: 'black',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'not-allowed',
      marginTop: '10px',
      fontSize: '16px'
    },
    claimMessage: {
      padding: '10px',
      border: 'none',
      borderRadius: '5px',
      marginTop: '10px',
      textAlign: 'center',
      fontSize: '14px'
    },
    infoMessage: {
      backgroundColor: '#e9ecef',
      color: '#495057'
    },
    successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24'
    },
    pgph: {
      marginBottom: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Search for Lost or Found Items</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="description"
          type="text"
          placeholder="Enter keywords (e.g., 'wallet', 'keys')"
          value={searchQuery.description}
          onChange={handleChange}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {message && <div style={styles.message}>{message}</div>}

      {results.length > 0 && (
        <ul style={styles.list}>
          {results.map(result => (
            <li key={result.report._id} style={styles.card}>
              <div style={styles.imageContainer}>
                {result.report.image ? (
                  <img
                    src={`http://localhost:5000/uploads/${result.report.image}`}
                    alt={result.report.itemName}
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.noImageText}>No image available</div>
                )}
              </div>

              <div className="descriptionContainer">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', width: '500px' }}>
                  <h3 style={{marginLeft: '4px'}}>{result.report.itemName}</h3>
                  <span style={styles.reportTypeBadge(result.report.reportType)}>
                    {result.report.reportType}
                  </span>
                </div>
                <p style={styles.pgph}><strong>Similarity Score:</strong><b> {isFinite(result.matchScore) ? `${result.matchScore.toFixed(2)}%` : '0.00%'}</b></p>
                <p style={styles.pgph}><strong>Location:</strong> {result.report.location}</p>
                <p style={styles.pgph}><strong>Date:</strong> {new Date(result.report.date).toLocaleDateString()}</p>
                <p style={styles.pgph}><strong>Description:</strong> {result.report.description}</p>
                <p style={styles.pgph}><strong>Contact:</strong> {result.report.contact}</p>

                {result.report.postedBy === currentUserId ? (
                  <div style={{ ...styles.claimMessage, ...styles.infoMessage }}>
                    You posted this item.
                  </div>
                ) : (
                  result.report.reportType === 'found' && result.report.claimStatus === 'none' && (
                    <button
                      style={styles.claimButton}
                      onClick={() => handleClaim(result.report._id, result.matchScore)}
                      disabled={claimMessage[result.report._id]?.type === 'info'}
                    >
                      Claim This Item
                    </button>
                  )
                )}
                {result.report.reportType === 'found' && result.report.claimStatus !== 'none' && result.report.postedBy !== currentUserId && (
                  <button
                    style={styles.claimedButton}
                    disabled
                  >
                    {result.report.claimStatus === 'pending' ? 'Claim Pending' : 'Claim Approved'}
                  </button>
                )}

                {claimMessage[result.report._id] && (
                  <div style={{
                    ...styles.claimMessage,
                    ...(claimMessage[result.report._id].type === 'info' && styles.infoMessage),
                    ...(claimMessage[result.report._id].type === 'success' && styles.successMessage),
                    ...(claimMessage[result.report._id].type === 'error' && styles.errorMessage)
                  }}>
                    {claimMessage[result.report._id].text}
                  </div>
                  )}
              </div>

            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchItems;