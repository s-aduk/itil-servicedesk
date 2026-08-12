const User = require('../models/user.model');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('-password -refreshToken').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, department, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, department, role, isActive },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, updateUser };
