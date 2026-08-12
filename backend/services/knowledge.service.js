const KnowledgeArticle = require('../models/knowledgeArticle.model');

const getArticles = async ({ search, category, page = 1, limit = 20 }) => {
  const q = { published: true };
  if (category) q.category = category;
  if (search) q.$text = { $search: search };
  const skip = (page - 1) * limit;
  const [articles, total] = await Promise.all([
    KnowledgeArticle.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select('-content'),
    KnowledgeArticle.countDocuments(q),
  ]);
  return { articles, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } };
};

const getArticleById = async (id) => {
  const article = await KnowledgeArticle.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  return article;
};

const createArticle = async (data, user) => {
  return KnowledgeArticle.create({ ...data, author: user._id, authorName: user.name });
};

const updateArticle = async (id, data) => {
  const article = await KnowledgeArticle.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  return article;
};

const deleteArticle = async (id) => {
  const article = await KnowledgeArticle.findByIdAndDelete(id);
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
};

const voteArticle = async (id, helpful) => {
  const inc = helpful ? { helpful: 1 } : { notHelpful: 1 };
  return KnowledgeArticle.findByIdAndUpdate(id, { $inc: inc }, { new: true });
};

const getRelatedArticles = async (category, excludeId, limit = 4) => {
  return KnowledgeArticle.find({ category, published: true, _id: { $ne: excludeId } })
    .sort({ helpful: -1, views: -1 }).limit(limit).select('title category views helpful');
};

module.exports = { getArticles, getArticleById, createArticle, updateArticle, deleteArticle, voteArticle, getRelatedArticles };
