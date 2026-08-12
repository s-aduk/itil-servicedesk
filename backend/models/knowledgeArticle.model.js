const mongoose = require('mongoose');

const knowledgeArticleSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
  content:  { type: String, required: true, trim: true, minlength: 20 },
  category: {
    type: String,
    enum: ['access_management','service_interruption','hardware_software','data_integrity','general_inquiry'],
    required: true,
  },
  tags:       [{ type: String, trim: true, lowercase: true }],
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  views:      { type: Number, default: 0 },
  helpful:    { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  published:  { type: Boolean, default: true },
}, { timestamps: true });

knowledgeArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);
