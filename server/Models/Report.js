const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  reportType: { type: String, enum: ['lost', 'found'], required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  image: { type: String, required: false },
  claimStatus: { type: String, enum: ['none', 'pending', 'approved', 'not-found-yet', 'has-been-found'], default: 'none' },
  claimBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  claimScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
