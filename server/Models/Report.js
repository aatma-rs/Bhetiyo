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
  claimStatus: { type: String, enum: ['none', 'pending', 'approved'], default: 'none' },
  claimBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
