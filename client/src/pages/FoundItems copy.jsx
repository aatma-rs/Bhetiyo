import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const res = await axios.get('/api/reports/found');
        setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFoundItems();
  }, []);

  const handleClaim = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('You must be logged in to claim an item.');
        return;
      }

      // Corrected API endpoint: /api/reports/:id/claim
      await axios.post(`/api/reports/${itemId}/claim`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage('Claim request submitted. Await admin approval.');
      
      // Update the item's claimStatus in the local state to reflect the change
      setItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId
            ? { ...item, claimStatus: 'pending' } // Assuming claimStatus goes to 'pending'
            : item
        )
      );

    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Failed to submit claim.');
    }
  };

  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '900px',
      margin: '0 auto',
    },
    card: {
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '15px',
      backgroundColor: '#f7f7f7',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    },
    title: {
      marginBottom: '10px',
      color: '#dc3545',
    },
    button: {
      marginTop: '10px',
      padding: '10px 16px',
      backgroundColor: '#28a745',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '15px',
    },
    claimedButton: { // Add style for claimed button
      marginTop: '10px',
      padding: '10px 16px',
      backgroundColor: '#6c757d', // Grey color
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'not-allowed',
      fontSize: '15px',
    },
    message: {
      padding: '10px',
      marginBottom: '20px',
      borderRadius: '4px',
      textAlign: 'center',
      backgroundColor: '#fff3cd',
      color: '#856404',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Found Items</h2>

      {message && <div style={styles.message}>{message}</div>}

      {loading ? (
        <p>Loading found items...</p>
      ) : items.length === 0 ? (
        <p>No found items reported.</p>
      ) : (
        items.map(item => (
          <div key={item._id} style={styles.card}>
            <h3>{item.itemName}</h3>
            <p><strong>Location:</strong> {item.location}</p>
            <p><strong>Description:</strong> {item.description}</p>
            <p><strong>Contact:</strong> {item.contact}</p>
            <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
            {item.claimStatus === 'none' ? (
              <button style={styles.button} onClick={() => handleClaim(item._id)}>Claim</button>
            ) : (
              <button style={styles.claimedButton} disabled>
                {item.claimStatus === 'pending' ? 'Claim Pending' : 'Claim Approved'}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default FoundItems;