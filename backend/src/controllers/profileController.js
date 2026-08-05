const profileService = require("../services/profileService");

const getProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const profile = await profileService.updateProfile(req.user.id, { name });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await profileService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const changeEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const profile = await profileService.changeEmail(req.user.id, { email });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const changeEmailRequest = async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const result = await profileService.changeEmailRequest(req.user.id, {
      newEmail,
      currentPassword,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const verifyEmailChange = async (req, res, next) => {
  try {
    const { newEmail, otp } = req.body;
    const profile = await profileService.verifyEmailChange(req.user.id, {
      newEmail,
      otp,
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file)
      throw Object.assign(new Error("No image provided"), { status: 400 });
    const profile = await profileService.updateAvatar(
      req.user.id,
      req.file.buffer,
      req.file.mimetype,
    );
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};
const requestSetPasswordOTP = async (req, res, next) => {
  try {
    const result = await profileService.requestSetPasswordOTP(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const setPassword = async (req, res, next) => {
  try {
    const { newPassword, otp } = req.body;
    const result = await profileService.setPassword(req.user.id, {
      newPassword,
      otp,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestSetPasswordOTP,
  setPassword,
  getProfile,
  updateProfile,
  changePassword,
  changeEmail,
  changeEmailRequest,
  verifyEmailChange,
  updateAvatar,
};
