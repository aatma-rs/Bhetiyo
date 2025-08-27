// src/pages/LostItemMatches.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function LostItemMatches() {
  const { lostReportId } = useParams();
  const [matches, setMatches] = useState([]);
  const [lostItemName, setLostItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimMessage, setClaimMessage] = useState({}); // To manage messages per claim
  const [currentUserId, setCurrentUserId] = useState(null); // State to store current user's ID
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
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
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const lostItemResponse = await axios.get(`http://localhost:5000/api/reports/lost`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const lostItem = lostItemResponse.data.find(item => item._id === lostReportId);
        if (lostItem) {
          setLostItemName(lostItem.itemName);
        } else {
          setLostItemName('Unknown Lost Item');
        }

        const matchesResponse = await axios.get(`http://localhost:5000/api/reports/lost/${lostReportId}/matches`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMatches(matchesResponse.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch matches. Please ensure you are logged in and the report ID is valid.');
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    if (lostReportId) {
      fetchMatches();
    }
  }, [lostReportId, navigate]);

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
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.foundReport._id === reportId 
            ? { ...match, foundReport: { ...match.foundReport, claimStatus: 'pending' } } 
            : match
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
    matchList: {
      listStyleType: 'none',
      padding: 0
    },
    matchItem: {
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      position: 'relative' // For message positioning
    },
    strong: {
      fontWeight: 'bold'
    },
    noMatches: {
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic'
    },
    error: {
      textAlign: 'center',
      color: '#dc3545',
      fontWeight: 'bold'
    },
    claimButton: {
      backgroundColor: '#28a745',
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

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Finding Matches for "{lostItemName || 'Lost Item'}"...</h2>
        <p style={{ textAlign: 'center' }}>Loading possible matches, please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Error Finding Matches</h2>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Possible Matches for "{lostItemName}"</h2>
      
      {matches.length === 0 ? (
        <p style={styles.noMatches}>No significant matches found for this item yet.</p>
      ) : (
        <ul style={styles.matchList}>
          {matches.map((match) => (
            <li key={match.foundReport._id} style={styles.matchItem}>
              <div><span style={styles.strong}>Found Item:</span> {match.foundReport.itemName}</div>
              <div><span style={styles.strong}>Similarity:</span> {(match.similarity * 100).toFixed(2)}%</div>
              <div><span style={styles.strong}>Description:</span> {match.foundReport.description}</div>
              <div><span style={styles.strong}>Location Found:</span> {match.foundReport.location}</div>
              <div><span style={styles.strong}>Date Found:</span> {new Date(match.foundReport.date).toLocaleDateString()}</div>
              <div><span style={styles.strong}>Contact:</span> {match.foundReport.contact}</div>

              {/* Show claim button ONLY if not posted by current user */}
              {match.foundReport.postedBy === currentUserId ? (
                <div style={styles.postedByMessage}>You posted this item.</div>
              ) : (
                match.foundReport.claimStatus === 'none' && (
                  <button 
                    style={styles.claimButton}
                    onClick={() => handleClaim(match.foundReport._id)}
                    disabled={claimMessage[match.foundReport._id]?.type === 'info'}
                  >
                    Claim This Item
                  </button>
                )
              )}
              {match.foundReport.claimStatus !== 'none' && match.foundReport.postedBy !== currentUserId && (
                <button 
                  style={styles.claimedButton}
                  disabled
                >
                  {match.foundReport.claimStatus === 'pending' ? 'Claim Pending' : 'Claim Approved'}
                </button>
              )}

              {claimMessage[match.foundReport._id] && (
                <div style={{
                  ...styles.claimMessage,
                  ...(claimMessage[match.foundReport._id].type === 'info' && styles.infoMessage),
                  ...(claimMessage[match.foundReport._id].type === 'success' && styles.successMessage),
                  ...(claimMessage[match.foundReport._id].type === 'error' && styles.errorMessage)
                }}>
                  {claimMessage[match.foundReport._id].text}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LostItemMatches;