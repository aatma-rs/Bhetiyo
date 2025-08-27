import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null); // Re-added: State to store current user's ID

  useEffect(() => {
    // Re-added: Logic to get current user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(decodedToken.userId); // Assuming 'userId' is the field in your token payload
      } catch (e) {
        console.error("Error decoding token:", e);
        // Handle error, e.g., clear token, redirect to login
      }
    }

    const fetchFoundItems = async () => {
      try {
        const res = await axios.get('/api/reports/found'); //
        setItems(res.data); //
      } catch (err) {
        console.error(err); //
      } finally {
        setLoading(false); //
      }
    };
    fetchFoundItems(); //
  }, []); // Empty dependency array means this runs once on mount

  const handleClaim = async (itemId) => {
    try {
      const token = localStorage.getItem('token'); //
      if (!token) {
        setMessage('You must be logged in to claim an item.'); //
        return;
      }

      await axios.post(`/api/reports/${itemId}/claim`, {}, { //
        headers: {
          Authorization: `Bearer ${token}`, //
        },
      });

      setMessage('Claim request submitted successfully! Await for admin approval.'); //
      
      // Update the item's claimStatus in the local state to reflect the change
      setItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId
            ? { ...item, claimStatus: 'pending' } // Assuming claimStatus goes to 'pending'
            : item
        )
      );

    } catch (err) {
      console.error(err); //
      setMessage(err.response?.data?.error || 'Failed to submit claim.'); //
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
    // This style is used for displaying the status message, not a clickable button
    statusMessageDisplay: {
      marginTop: '10px',
      padding: '10px 16px',
      backgroundColor: '#6c757d', // Grey color for status display
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'default', // Explicitly make it not clickable
      fontSize: '15px',
      display: 'inline-block', // Helps with padding and background
      textAlign: 'center',
    },
    message: {
      padding: '10px',
      marginBottom: '20px',
      borderRadius: '4px',
      textAlign: 'center',
      backgroundColor: '#fff3cd',
      color: '#856404',
    },
    postedByMessage: { // Style for "You posted this item" message
      marginTop: '10px',
      padding: '10px',
      backgroundColor: '#d1ecf1',
      color: '#0c5460',
      borderRadius: '4px',
      textAlign: 'center',
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
            
            {/* Conditional rendering logic, directly mimicking SearchItems.jsx */}
            {item.postedBy === currentUserId ? (
              // Case 1: The current user posted this item. Show "You posted this item" message.
              <div style={styles.postedByMessage}>You posted this item.</div>
            ) : item.claimStatus !== 'none' ? (
              // Case 2: The item has a claim status (pending or approved), AND the current user is NOT the poster.
              // Display the claim status as a non-interactive message.
              <div
                style={styles.statusMessageDisplay}
              >
                {item.claimStatus === 'pending' ? 'Claim Pending' : 'Claim Approved'}
              </div>
            ) : (
              // Case 3: The item has no claim status ('none'), AND the current user is NOT the poster.
              // Display the "Claim This Item" button.
              <button
                style={styles.button}
                onClick={() => handleClaim(item._id)}
              >
                Claim This Item
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default FoundItems;