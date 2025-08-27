import React, { useEffect, useState } from 'react';
import axios from 'axios';

function LostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const res = await axios.get('/api/reports/lost');
        setItems(res.data);
      } catch (err) {
        console.error('Error loading lost items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '900px',
      margin: '0 auto',
    },
    title: {
      marginBottom: '20px',
      color: '#007bff',
    },
    card: {
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '15px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    },
    label: {
      fontWeight: 'bold',
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Lost Items</h2>

      {loading ? (
        <p>Loading lost items...</p>
      ) : items.length === 0 ? (
        <p>No lost items reported.</p>
      ) : (
        items.map(item => (
          <div key={item._id} style={styles.card}>
            <h3>{item.itemName}</h3>
            <p><span style={styles.label}>Location:</span> {item.location}</p>
            <p><span style={styles.label}>Description:</span> {item.description}</p>
            <p><span style={styles.label}>Contact:</span> {item.contact}</p>
            <p><span style={styles.label}>Date:</span> {new Date(item.date).toLocaleDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default LostItems;
