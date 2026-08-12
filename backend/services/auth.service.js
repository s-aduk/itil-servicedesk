const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AuditLog = require('../models/auditLog.model');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const registerUser = async ({ name, email, password, role, department }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }
  const user = await User.create({ name, email, password, role: role || 'end_user', department });
  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    action: 'USER_REGISTERED',
    userId: user._id,
    userName: user.name,
    details: { email, role: user.role },
  });

  return { user, accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (!user || !(await user.matchPassword(password))) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('This account has been deactivated. Contact your administrator.');
    err.statusCode = 403;
    throw err;
  }
  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await AuditLog.create({
    action: 'USER_LOGIN',
    userId: user._id,
    userName: user.name,
    details: { email },
  });

  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error('No refresh token provided');
    err.statusCode = 401;
    throw err;
  }
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }
  const tokens = generateTokens(user._id);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });
  return tokens;
};

module.exports = { registerUser, loginUser, refreshAccessToken };
