// src/pages/SearchItems.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SearchItems() {
  const [searchQuery, setSearchQuery] = useState({
    description: '',
  });
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState({}); // To manage messages per claim
  const [currentUserId, setCurrentUserId] = useState(null); // State to store current user's ID
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Decode token to get user ID
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1])); // Basic decoding for client-side
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
    setClaimMessage({}); // Clear claim messages on new search

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/search', {
        searchDescription: searchQuery.description,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setResults(response.data);
      if (response.data.length === 0) {
        setMessage('No matching items found.');
      } else {
        setMessage(`Found ${response.data.length} potential matches.`);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('Please log in to perform a search.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(err.response?.data?.error || 'Failed to perform search.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleClaim = async (reportId) => {
    setClaimMessage(prev => ({ ...prev, [reportId]: { text: 'Submitting claim...', type: 'info' } }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/reports/${reportId}/claim`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setClaimMessage(prev => ({ ...prev, [reportId]: { text: 'Claim request submitted successfully! Await for admin approval.', type: 'success' } }));
      // Optionally, update the claimStatus of the item in the UI
      setResults(prevResults => 
        prevResults.map(result => 
          result.report._id === reportId 
            ? { ...result, report: { ...result.report, claimStatus: 'pending' } } 
            : result
        )
      );
    } catch (err) {
      setClaimMessage(prev => ({ ...prev, [reportId]: { text: err.response?.data?.error || 'Failed to submit claim.', type: 'error' } }));
      console.error("Claim error:", err);
    }
  };


  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    title: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#333'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      marginBottom: '30px'
    },
    textarea: {
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      minHeight: '80px',
      resize: 'vertical'
    },
    button: {
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer'
    },
    message: {
      textAlign: 'center',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '15px'
    },
    resultList: {
      listStyleType: 'none',
      padding: 0
    },
    resultItem: {
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    strong: {
      fontWeight: 'bold'
    },
    reportType: {
      fontSize: '0.9em',
      fontStyle: 'italic',
      color: '#555'
    },
    claimButton: {
      backgroundColor: '#28a745', // Green for claim
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '10px',
      alignSelf: 'flex-start'
    },
    claimedButton: {
      backgroundColor: '#6c757d', // Grey for claimed
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'not-allowed',
      marginTop: '10px',
      alignSelf: 'flex-start'
    },
    claimMessage: {
      fontSize: '0.9em',
      marginTop: '5px',
      padding: '5px',
      borderRadius: '3px'
    },
    infoMessage: {
      backgroundColor: '#e2e3e5',
      color: '#383d41'
    },
    successMessage: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      color: '#721c24'
    },
    postedByMessage: {
      fontSize: '0.9em',
      marginTop: '5px',
      padding: '5px',
      borderRadius: '3px',
      backgroundColor: '#e0f7fa',
      color: '#00796b',
      alignSelf: 'flex-start'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Search for Lost or Found Items</h2>
      
      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.includes('No matching') || message.includes('Failed') ? '#f8d7da' : '#d4edda',
          color: message.includes('No matching') || message.includes('Failed') ? '#721c24' : '#155724'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          name="description"
          placeholder="Enter description of the item you are looking for (e.g., 'red leather wallet with a broken zipper')"
          value={searchQuery.description}
          onChange={handleChange}
          style={styles.textarea}
          required
        />
        <button 
          type="submit" 
          style={styles.button}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search Items'}
        </button>
      </form>

      {results.length > 0 && (
        <ul style={styles.resultList}>
          {results.map((result) => (
            <li key={result.report._id} style={styles.resultItem}>
              <div><span style={styles.strong}>Item Name:</span> {result.report.itemName}</div>
              <div><span style={styles.strong}>Report Type:</span> <span style={styles.reportType}>{result.report.reportType}</span></div>
              <div><span style={styles.strong}>Similarity:</span> {(result.similarity * 100).toFixed(2)}%</div>
              <div><span style={styles.strong}>Description:</span> {result.report.description}</div>
              <div><span style={styles.strong}>Location:</span> {result.report.location}</div>
              <div><span style={styles.strong}>Date:</span> {new Date(result.report.date).toLocaleDateString()}</div>
              <div><span style={styles.strong}>Contact:</span> {result.report.contact}</div>

              {/* Show claim button ONLY for 'found' items in search results AND if not posted by current user */}
              {result.report.reportType === 'found' && result.report.postedBy === currentUserId ? (
                <div style={styles.postedByMessage}>You posted this item.</div>
              ) : (
                result.report.reportType === 'found' && result.report.claimStatus === 'none' && (
                  <button 
                    style={styles.claimButton}
                    onClick={() => handleClaim(result.report._id)}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchItems;