const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const supabase = require("../config/supabase");
const logger = require("../utils/logger");
const { sendOTP } = require("../utils/sendEmail");
const fetch = require("node-fetch");

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const register = async (name, email, password) => {
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (existing && existing.email_verified) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expires = new Date(Date.now() + 10 * 60 * 1000);

  if (existing && !existing.email_verified) {
    const { error } = await supabase
      .from("users")
      .update({
        name,
        password_hash,
        otp,
        otp_expires: otp_expires.toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw error;

    sendOTP(email, otp).catch((err) => logger.error("OTP email error:", err));
    return { id: existing.id, message: "OTP resent to email" };
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert([
      {
        name,
        email,
        password_hash,
        provider: "email",
        email_verified: false,
        otp,
        otp_expires: otp_expires.toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;

  sendOTP(email, otp).catch((err) => logger.error("OTP email error:", err));
  return { id: user.id, message: "OTP sent to email" };
};

const verifyOTP = async (email, otp) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.email_verified)
    throw Object.assign(new Error("Email already verified"), { status: 400 });
  if (user.otp !== otp || new Date(user.otp_expires) < new Date()) {
    throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ email_verified: true, otp: null, otp_expires: null })
    .eq("id", user.id);

  if (updateError) throw updateError;

  if (!user.plan_id) {
    const { data: freePlan } = await supabase
      .from("plans")
      .select("id")
      .eq("name", "Free")
      .single();

    if (freePlan) {
      await supabase
        .from("users")
        .update({ plan_id: freePlan.id, plan_expire: null })
        .eq("id", user.id);
    }
  }

  const token = generateToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

const resendOTP = async (email) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.email_verified)
    throw Object.assign(new Error("Email already verified"), { status: 400 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expires = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase
    .from("users")
    .update({ otp, otp_expires: otp_expires.toISOString() })
    .eq("id", user.id);

  if (error) throw error;

  sendOTP(email, otp).catch((err) => logger.error("OTP email error:", err));
  return { message: "OTP resent to email" };
};

const login = async (email, password) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user)
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  if (!user.email_verified)
    throw Object.assign(new Error("Email not verified"), { status: 403 });

  // If user has no password, they must use Google
  if (!user.password_hash) {
    throw Object.assign(new Error("Please login with Google"), { status: 400 });
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch)
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });

  const token = generateToken({ id: user.id, email: user.email });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    },
  };
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (accessToken) => {
  // Get user information from Google using the access token
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw Object.assign(new Error("Invalid Google access token"), {
      status: 401,
    });
  }

  const payload = await response.json();

  const { email, name, picture, email_verified } = payload;

  if (!email || !email_verified) {
    throw Object.assign(new Error("Google account not verified"), {
      status: 401,
    });
  }

  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) {
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          provider: "google",
          email_verified: true,
          avatar_url: picture,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    user = newUser;

    const { data: freePlan } = await supabase
      .from("plans")
      .select("id")
      .eq("name", "Free")
      .single();

    if (freePlan) {
      await supabase
        .from("users")
        .update({
          plan_id: freePlan.id,
        })
        .eq("id", user.id);
    }
  } else if (user.provider !== "google") {
    throw Object.assign(
      new Error(
        "Email already registered with password. Please login using email.",
      ),
      {
        status: 409,
      },
    );
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    },
  };
};
const getMe = async (userId) => {
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, name, email, avatar_url, plan_id, plan_expire, today_download_count, last_download_date",
    )
    .eq("id", userId)
    .single();

  if (error || !user)
    throw Object.assign(new Error("User not found"), { status: 404 });
  return user;
};

module.exports = {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleLogin,
  getMe,
};
