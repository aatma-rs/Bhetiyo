const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./Models/User');
const Report = require('./Models/Report');

const app = express();
dotenv.config();

// Uploads ko path
const uploadsDir = path.join(__dirname, 'uploads');

// Path check gareko
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory.');
}

// Multer use garera file upload garna ko lagi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Image files lina ko lagi
app.use('/uploads', express.static(uploadsDir));

app.use(cors());
app.use(express.json());

// MongoDB connection
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

const stopwords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has',
  'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was',
  'were', 'will', 'with', 'i', 'my', 'me', 'you', 'your', 'yours', 'we',
  'our', 'ours', 'they', 'them', 'their', 'this', 'that', 'those', 'near',
  'during', 'premises', 'please', 'across', 'about', 'know', 'contact', 'area',
  'colored', 'lost', 'found',
]);

const tokenizeAndPreprocess = (text) => {
  if (!text) return [];
  const tokens = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/).filter(token => token.length > 0);
  return tokens;
};

const removeStopwordsFromTokens = (tokens) => {
  return tokens.filter(token => !stopwords.has(token));
};

const synonymMap = {
  'phone': ['cellphone', 'mobile', 'iphone'], 'cellphone': ['phone', 'mobile', 'iphone'],
  'mobile': ['phone', 'cellphone', 'iphone'], 'iphone': ['phone', 'cellphone', 'mobile'],
  'wallet': 'purse', 'purse': 'wallet',
  'keys': 'keychain', 'keychain': 'keys',
  'glasses': ['spectacles', 'chasma'], 'spectacles': ['glasses', 'chasma'], 'chasma': ['glasses', 'spectacles'],
  'bag': 'backpack', 'backpack': 'bag',
  'watch': 'ghadi', 'ghadi': 'watch',
  'earrings': 'jewelry', 'jewelry': 'earrings',
  'book': 'textbook', 'textbook': 'book',
  'card': 'id', 'id': 'card',
  'tablet': 'ipad', 'ipad': 'tablet',
  'headphones': ['earphones', 'earbuds'], 'earphones': ['headphones', 'earbuds'], 'earbuds': ['headphones', 'earphones'],
  'jacket': 'coat', 'coat': 'jacket',
  'helmet': ['helmets', 'hemlet', 'hemlets'], 'helmets': ['helmet', 'hemlet', 'hemlets'],
  'hemlet': ['helmet', 'helmets', 'hemlets'], 'hemlets': ['helmet', 'helmets', 'hemlet'],
  'umbrella' : 'chata', 'chata': 'umbrella',
  'cap': ['hat', 'topi'], 'hat': ['hat', 'cap'], 'topi': ['hat', 'cap'],
  'scarf': 'galbandi', 'galbandi': 'scarf',
  'scratch': ['scratches', 'scratched'], 'scratches': ['scratch', 'scratched'], 'scratched': ['scratches', 'scratch'], 
  'cafe': ['canteen', 'cafeteria'], 'canteen': ['cafe', 'cafeteria'], 'cafeteria': ['cafe', 'cafeteria'],
  'class': 'classroom', 'classroom': 'class',
  'blue': 'nilo', 'nilo': 'blue',
  'red': ['rato', 'raato'], 'rato': ['red', 'raato'], 'raato': ['red', 'rato'],
  'black': ['kaalo', 'kaalo'], 'kalo': ['black', 'kaalo'], 'kaalo': ['black', 'kalo'],
  'white': 'seto',  
  'green': 'hariyo', 'hariyo': 'green',
  'yellow': 'pahelo', 'pahelo': 'yellow',
};

const applySynonyms = (tokens) => {
  const expandedTokens = [...tokens];
  for (const token of tokens) {
    if (synonymMap[token]) {
      const synonyms = synonymMap[token];
      if (Array.isArray(synonyms)) {
        expandedTokens.push(...synonyms);
      } else {
        expandedTokens.push(synonyms);
      }
    }
  }
  return expandedTokens;
};

const calculateTF = (documentTokens) => {
  const termFrequencies = {};
  if (documentTokens.length === 0) return {};
  documentTokens.forEach(term => {
    termFrequencies[term] = (termFrequencies[term] || 0) + 1;
  });
  return termFrequencies;
};

const calculateIDF = (corpus) => {
  const documentCount = corpus.length;
  const idfScores = {};
  const allTerms = new Set(corpus.flat());

  allTerms.forEach(term => {
    const documentsWithTerm = corpus.filter(doc => doc.includes(term)).length;
    idfScores[term] = Math.log10(documentCount / (documentsWithTerm));
  });
  return idfScores;
};

const cosineSimilarity = (vecA, vecB) => {
  const commonTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  commonTerms.forEach(term => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dotProduct += a * b;
    magnitudeA += a * a;
    magnitudeB += b * b;
  });

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, contact } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      contact,
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '3h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/reports', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { itemName, reportType, location, contact, date, description } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newReport = new Report({
      itemName,
      reportType,
      location,
      contact,
      date,
      description,
      postedBy: userId,
      userName: user.name,
      image: req.file ? req.file.filename : null,
      claimStatus: (reportType == 'lost') ? 'not-found-yet' : 'none',
    });

    await newReport.save();
    res.status(201).json({ message: 'Report submitted successfully', report: newReport });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report', details: err.message });
  }
});

app.get('/api/public/reports/all', async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/public/reports/lost', async (req, res) => {
  try {
    const reports = await Report.find({ reportType: 'lost' })
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lost reports' });
  }
});

app.get('/api/public/reports/found', async (req, res) => {
  try {
    const reports = await Report.find({ reportType: 'found' })
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch found reports' });
  }
});

app.get('/api/reports/my', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.find({ postedBy: req.user.userId })
    .populate('postedBy', 'name')
    .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user reports' });
  }
});

app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const allReports = await Report.find({});

    const documents = allReports.map(report =>
      removeStopwordsFromTokens(applySynonyms(tokenizeAndPreprocess(`${report.itemName || ''} ${report.description || ''}`)))
    );
    const queryTokens = removeStopwordsFromTokens(applySynonyms(tokenizeAndPreprocess(query)));

    // Query empty bhaye empty array return garcha, to prevent NaN
    if (queryTokens.length === 0) {
      return res.json([]);
    }

    const tfScores = documents.map(doc => calculateTF(doc));
    const idfScores = calculateIDF(documents);

    // TF-IDF vectorization garcha
    const queryTF = calculateTF(queryTokens);
    const queryVector = {};
    for (const term in queryTF) {
      const tfidf = (queryTF[term] || 0) * (idfScores[term] || 0);
      if (isFinite(tfidf)) {
        queryVector[term] = tfidf;
      }
    }

    // Similarity nikalne for each items
    const searchResults = allReports.map((report, index) => {
      const documentTF = tfScores[index];
      const documentVector = {};

      for (const term in documentTF) {
        const tfidf = documentTF[term] * (idfScores[term] || 0);
        if (isFinite(tfidf)) {
          documentVector[term] = tfidf;  
        }
      }

      const matchScore = cosineSimilarity(queryVector, documentVector);

      // NaN aaye 0 banaidine
      const finalScore = isFinite(matchScore) ? matchScore * 100 : 0;

      return { report, matchScore: finalScore };
    }).filter(result => result.matchScore > 0.001)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(searchResults);
  } catch (err) {
    console.error('Search failed:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/reports/:id/claim', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let { claimScore } = req.body;
    const userId = req.user.userId;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (report.reportType === 'lost') {
      return res.status(400).json({ error: 'Cannot claim a lost item' });
    }

    if (String(report.postedBy) === userId) {
      return res.status(400).json({ error: 'You cannot claim your own item' });
    }

    if (report.claimStatus !== 'none') {
      return res.status(400).json({ error: 'Item has already been claimed' });
    }

    const scoreToSave = typeof claimScore === 'number' && isFinite(claimScore) ? claimScore : 0;

    report.claimStatus = 'pending';
    report.claimBy = userId;
    report.claimScore = scoreToSave;
    await report.save();

    res.json({ message: 'Claim request submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
      if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
      }
      const users = await User.find({}).select('-password');
      res.json(users);
  } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
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
      const user = await User.findByIdAndUpdate(id, { role }, { new: true });
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
      const user = await User.findByIdAndDelete(id);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
  } catch (err) {
      res.status(500).json({ error: 'Failed to delete user' });
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

app.put('/api/admin/reports/:id/claim-status', authenticateToken, async (req, res) => {
  try {
      if (req.user.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
      }
      const { id } = req.params;
      const { claimStatus } = req.body;
      if (!['none', 'pending', 'approved', 'has-been-found', 'not-found-yet'].includes(claimStatus)) {
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
