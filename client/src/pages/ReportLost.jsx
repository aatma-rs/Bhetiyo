import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ReportLost() {
  const [form, setForm] = useState({
    itemName: '',
    location: '',
    contact: '',
    date: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [navigate]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/reports', {
        ...form,
        reportType: 'lost',
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage('Lost item report submitted successfully!');
      setForm({ itemName: '', location: '', contact: '', date: '', description: '' });

      // Assuming your backend returns the newly created report ID as 'reportId'
      const newReportId = response.data.reportId; 

      // Navigate to the LostItemMatches page with the new report ID
      navigate(`/lostItems/${newReportId}/matches`); 

    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('Please log in to submit a report.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(err.response?.data?.error || 'Failed to submit report.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    container: {
      padding: '40px 20px',
      maxWidth: '600px',
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
      gap: '15px'
    },
    input: {
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px'
    },
    textarea: {
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      minHeight: '100px',
      resize: 'vertical'
    },
    button: {
      padding: '12px',
      backgroundColor: '#dc3545',
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
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Report Lost Item</h2>
      
      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
          color: message.includes('successfully') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="itemName"
          type="text"
          placeholder="Item Name"
          value={form.itemName}
          onChange={handleChange}
          style={styles.input}
          required
        />
        <input
          name="location"
          type="text"
          placeholder="Location where item was lost"
          value={form.location}
          onChange={handleChange}
          style={styles.input}
          required
        />
        <input
          name="contact"
          type="text"
          placeholder="Your Contact Details"
          value={form.contact}
          onChange={handleChange}
          style={styles.input}
          required
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          style={styles.input}
          required
        />
        <textarea
          name="description"
          placeholder="Detailed description of the lost item"
          value={form.description}
          onChange={handleChange}
          style={styles.textarea}
          required
        />
        <button 
          type="submit" 
          style={styles.button}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Lost Report'}
        </button>
      </form>
    </div>
  );
}

export default ReportLost;