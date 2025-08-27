const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const natural = require('natural');
const { removeStopwords } = require('stopword');

const User = require('./Models/User');
const Report = require('./Models/Report');

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bhetiyo', {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const synonymMap = {
  'phone': ['mobile', 'cellphone', 'handset'],
  'wallet': ['purse', 'billfold'],
  'keys': ['keychain', 'car keys', 'house keys'],
  'bag': ['backpack', 'satchel', 'tote'],
  'watch': ['timepiece'],
  'laptop': ['notebook', 'computer'],
  'earrings': ['earring', 'jewelry'],
  'necklace': ['chain', 'pendant', 'jewelry'],
  'ring': ['band', 'jewelry'],
  'glasses': ['spectacles', 'eyewear'],
  'umbrella': ['parasol'],
  'id': ['identification', 'driver\'s license', 'passport', 'id card'],
  'card': ['credit card', 'debit card', 'access card'],
  'book': ['novel', 'textbook'],
  'camera': ['digital camera', 'dslr'],
  'charger': ['adapter', 'power cord'],
  'headphone': ['earphone', 'headset'],
  'documents': ['papers', 'files'],
  'bottle': ['water bottle', 'flask'],
  'jewelry': ['jewellery', 'ornament'],
};

const preprocessText = (text) => {
  if (!text) return '';
  let processedText = text.toLowerCase();
  processedText = processedText.replace(/[.,!?;:"']/g, '');
  let words = natural.PorterStemmer.tokenizeAndStem(processedText);
  words = removeStopwords(words);

  words = words.map(word => {
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (key === word || synonyms.includes(word)) {
        return natural.PorterStemmer.stem(key);
      }
    }
    return word;
  });

  return words.join(' ');
};

app.get('/', (req, res) => {
  res.send('Bhetiyo Backend');
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      contact
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/reports/lost', async (req, res) => {
  try {
    const lostReports = await Report.find({ reportType: 'lost' }).populate('postedBy', 'name');
    res.json(lostReports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lost reports' });
  }
});

app.get('/api/reports/found', async (req, res) => {
  try {
    const foundReports = await Report.find({ reportType: 'found' }).populate('postedBy', 'name');
    res.json(foundReports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch found reports' });
  }
});

app.post('/api/reports', authenticateToken, async (req, res) => {
  try {
    const report = new Report({
      ...req.body,
      reportType: req.body.reportType, // Ensure reportType is passed correctly from frontend
      postedBy: req.user.userId,
      userName: req.user.name
    });
    await report.save();
    res.status(201).json({ message: 'Report submitted successfully!', reportId: report._id }); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.get('/api/reports/my', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.find({ postedBy: req.user.userId });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your reports' });
  }
});

app.post('/api/reports/:id/claim', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // A user can only claim a 'found' item (i.e., they are claiming to be the owner of a found item)
    if (report.reportType !== 'found') {
      return res.status(400).json({ error: 'Only found items can be claimed by their rightful owner.' });
    }

    // A user cannot claim an item they themselves found and reported
    if (report.postedBy.toString() === req.user.userId.toString()) {
      return res.status(400).json({ error: 'You cannot claim an item you yourself reported as found.' });
    }

    if (report.claimStatus !== 'none') {
      return res.status(400).json({ error: 'Item is already claimed or approved.' });
    }

    report.claimStatus = 'pending';
    report.claimBy = req.user.userId;
    await report.save();

    res.json({ message: 'Claim request submitted!', report }); // Return the updated report
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim item' });
  }
});

app.get('/api/reports/lost/:lostReportId/matches', authenticateToken, async (req, res) => {
  try {
    const { lostReportId } = req.params;

    const lostReport = await Report.findById(lostReportId);
    if (!lostReport || lostReport.reportType !== 'lost') {
      return res.status(404).json({ error: 'Lost report not found' });
    }

    const foundReports = await Report.find({ reportType: 'found' });

    if (foundReports.length === 0) {
      return res.json([]);
    }

    const tfidf = new natural.TfIdf();

    const lostDescriptionProcessed = preprocessText(lostReport.description);
    tfidf.addDocument(lostDescriptionProcessed);

    const foundDescriptionsProcessed = foundReports.map(report => preprocessText(report.description));
    foundDescriptionsProcessed.forEach(desc => tfidf.addDocument(desc));

    const matches = [];
    const lostItemIndex = 0;

    for (let i = 0; i < foundReports.length; i++) {
      const foundItemIndex = i + 1;

      const vector1 = {};
      tfidf.listTerms(lostItemIndex).forEach(item => {
        vector1[item.term] = item.tfidf;
      });

      const vector2 = {};
      tfidf.listTerms(foundItemIndex).forEach(item => {
        vector2[item.term] = item.tfidf;
      });

      let dotProduct = 0;
      for (const term in vector1) {
        if (vector2[term]) {
          dotProduct += vector1[term] * vector2[term];
        }
      }

      let magnitude1 = 0;
      for (const term in vector1) {
        magnitude1 += vector1[term] * vector1[term];
      }
      magnitude1 = Math.sqrt(magnitude1);

      let magnitude2 = 0;
      for (const term in vector2) {
        magnitude2 += vector2[term] * vector2[term];
      }
      magnitude2 = Math.sqrt(magnitude2);

      let cosineSimilarity = 0;
      if (magnitude1 > 0 && magnitude2 > 0) {
        cosineSimilarity = dotProduct / (magnitude1 * magnitude2);
      }
      
      if (cosineSimilarity > 0.1) {
        matches.push({
          foundReport: foundReports[i],
          similarity: cosineSimilarity
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    res.json(matches);

  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ error: 'Failed to find matches' });
  }
});


app.post('/api/search', authenticateToken, async (req, res) => {
  try {
    const { searchDescription } = req.body;

    if (!searchDescription) {
      return res.status(400).json({ error: 'Search description is required' });
    }

    // Fetch all reports to search against both lost and found
    const allReports = await Report.find({});

    if (allReports.length === 0) {
      return res.json([]);
    }

    const tfidf = new natural.TfIdf();

    const searchDescriptionProcessed = preprocessText(searchDescription);
    tfidf.addDocument(searchDescriptionProcessed);

    const reportDescriptionsProcessed = allReports.map(report => preprocessText(report.description));
    reportDescriptionsProcessed.forEach(desc => tfidf.addDocument(desc));

    const matches = [];
    const searchItemIndex = 0;

    for (let i = 0; i < allReports.length; i++) {
      const reportIndex = i + 1;

      const vectorSearch = {};
      tfidf.listTerms(searchItemIndex).forEach(item => {
        vectorSearch[item.term] = item.tfidf;
      });

      const vectorReport = {};
      tfidf.listTerms(reportIndex).forEach(item => {
        vectorReport[item.term] = item.tfidf;
      });

      let dotProduct = 0;
      for (const term in vectorSearch) {
        if (vectorReport[term]) {
          dotProduct += vectorSearch[term] * vectorReport[term];
        }
      }

      let magnitudeSearch = 0;
      for (const term in vectorSearch) {
        magnitudeSearch += vectorSearch[term] * vectorSearch[term];
      }
      magnitudeSearch = Math.sqrt(magnitudeSearch);

      let magnitudeReport = 0;
      for (const term in vectorReport) {
        magnitudeReport += vectorReport[term] * vectorReport[term];
      }
      magnitudeReport = Math.sqrt(magnitudeReport);

      let cosineSimilarity = 0;
      if (magnitudeSearch > 0 && magnitudeReport > 0) {
        cosineSimilarity = dotProduct / (magnitudeSearch * magnitudeReport);
      }
      
      if (cosineSimilarity > 0.1) {
        matches.push({
          report: allReports[i],
          similarity: cosineSimilarity
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);

    res.json(matches);

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/reports', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const reports = await Report.find({}).populate('postedBy', 'name email').populate('claimBy', 'name email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.put('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Report.deleteMany({ postedBy: id });

    res.json({ message: 'User and their reports deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.put('/api/admin/reports/:id/claim-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { claimStatus } = req.body;

    if (!['none', 'pending', 'approved'].includes(claimStatus)) {
      return res.status(400).json({ error: 'Invalid claim status' });
    }

    const report = await Report.findByIdAndUpdate(
      id, 
      { claimStatus: claimStatus === 'none' ? 'none' : claimStatus, claimBy: claimStatus === 'none' ? null : undefined }, 
      { new: true }
    ).populate('postedBy', 'name email').populate('claimBy', 'name email');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Claim status updated successfully', report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update claim status' });
  }
});

app.delete('/api/admin/reports/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const report = await Report.findByIdAndDelete(id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});