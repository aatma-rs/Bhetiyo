import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '40px auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#343a40',
  },
  message: {
    textAlign: 'center',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  textarea: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical',
  },
  button: {
    padding: '12px',
    backgroundColor: '#b9313fff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: '#c82333',
  },
};

function ReportLost() {
  const [form, setForm] = useState({
    itemName: '',
    location: '',
    contact: '',
    date: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e) {
    setImageFile(e.target.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const token = localStorage.getItem('token');

    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }
    formData.append('reportType', 'lost');
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await axios.post('http://localhost:5000/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      setMessage('Lost item report submitted successfully!');
      setForm({ itemName: '', location: '', contact: '', date: '', description: '' });
      setImageFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Report a Lost Item</h2>

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
          placeholder="Location where item was last seen"
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
        <input
          type="file"
          name="image"
          onChange={handleFileChange}
          style={styles.input}
          accept="image/*"
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