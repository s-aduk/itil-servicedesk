const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
    res.status(200).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, refresh, getMe };
