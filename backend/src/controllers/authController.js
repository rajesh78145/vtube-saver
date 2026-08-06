const authService = require("../services/authService");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOTP(email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    const result = await authService.googleLogin(accessToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleLogin,
  me,
  logout,
};
