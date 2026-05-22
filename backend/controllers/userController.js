import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import bcrypt from 'bcryptjs';

/**
 * @desc    Update basic user profile details (Name, Mobile)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, mobile } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Perform validation
    if (name && name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name must be at least 2 characters.' });
    }

    if (mobile && !/^\+?[1-9]\d{1,14}$/.test(mobile.replace(/\s+/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format.' });
    }

    // Check if mobile number already taken by another user
    if (mobile && mobile !== user.mobile) {
      const mobileExists = await User.findOne({ mobile });
      if (mobileExists) {
        return res.status(400).json({ success: false, message: 'This mobile number is already linked to another account.' });
      }
      user.mobile = mobile;
    }

    if (name) user.name = name;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Find user with password selected
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Validate old password
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'The current password you entered is incorrect.' });
    }

    // Update password
    user.password = newPassword; // hashed by schema pre-save hook
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload / Update profile image
 * @route   POST /api/users/profile-image
 * @access  Private
 */
export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please provide an image file to upload.' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Save current image public_id for post-upload cleaning
    const oldPublicId = user.profileImage?.public_id;

    // Upload new buffer directly to Cloudinary
    console.log(`Uploading profile image to Cloudinary for user: ${user.email}`);
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

    // Save url and public_id to user model
    user.profileImage = {
      url: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
    };

    const updatedUser = await user.save();

    // Clean up old image from Cloudinary asynchronously
    if (oldPublicId) {
      deleteFromCloudinary(oldPublicId).catch((err) =>
        console.error('Async deletion of old image failed:', err)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded and updated successfully.',
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove profile image
 * @route   DELETE /api/users/profile-image
 * @access  Private
 */
export const removeProfileImage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const publicId = user.profileImage?.public_id;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'No profile image found to delete.' });
    }

    // Delete image on Cloudinary
    await deleteFromCloudinary(publicId);

    // Clear db columns
    user.profileImage = { url: '', public_id: '' };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
