const supabase = require("../config/supabase");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const crypto = require("crypto");

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, avatar_url, plan_id, plan_expire, today_download_count, last_download_date, plans(name, daily_limit, duration_days)",
    )
    .eq("id", userId)
    .single();

  if (error || !data)
    throw Object.assign(new Error("User not found"), { status: 404 });
  data.has_password = !!data.password_hash;
  delete data.password_hash;
  return data;
};

const updateProfile = async (userId, { name }) => {
  const { data, error } = await supabase
    .from("users")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, name, email, avatar_url")
    .single();

  if (error) throw error;
  return data;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch)
    throw Object.assign(new Error("Current password is incorrect"), {
      status: 400,
    });

  const password_hash = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from("users")
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
  return { message: "Password updated successfully" };
};

const changeEmailRequest = async (userId, { newEmail, currentPassword }) => {
  const { data: user } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch)
    throw Object.assign(new Error("Current password is incorrect"), {
      status: 400,
    });

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", newEmail)
    .single();

  if (existing)
    throw Object.assign(new Error("Email already in use"), { status: 409 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expires = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase
    .from("users")
    .update({ otp, otp_expires: otp_expires.toISOString() })
    .eq("id", userId);

  if (error) throw error;

  const { sendOTP } = require("../utils/sendEmail");
  sendOTP(newEmail, otp).catch((err) =>
    logger.error("Email change OTP error:", err),
  );

  return { message: `OTP sent to ${newEmail}`, newEmail };
};

const verifyEmailChange = async (userId, { newEmail, otp }) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.otp !== otp || new Date(user.otp_expires) < new Date()) {
    throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      email: newEmail,
      otp: null,
      otp_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, name, email, avatar_url")
    .single();

  if (error) throw error;
  return data;
};

const changeEmail = async (userId, { email }) => {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing)
    throw Object.assign(new Error("Email already in use"), { status: 409 });

  const { data, error } = await supabase
    .from("users")
    .update({ email, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, name, email, avatar_url")
    .single();

  if (error) throw error;
  return data;
};

const updateAvatar = async (userId, fileBuffer, mimetype) => {
  const ext = mimetype.split("/")[1] || "jpg";
  const filename = `avatars/${userId}_${crypto.randomBytes(4).toString("hex")}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filename, fileBuffer, { contentType: mimetype, upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicURL } = supabase.storage
    .from("avatars")
    .getPublicUrl(filename);

  const { data, error } = await supabase
    .from("users")
    .update({
      avatar_url: publicURL.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id, name, email, avatar_url")
    .single();

  if (error) throw error;
  return data;
};
const requestSetPasswordOTP = async (userId) => {
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expires = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase
    .from("users")
    .update({ otp, otp_expires: otp_expires.toISOString() })
    .eq("id", userId);

  if (error) throw error;

  const { sendOTP } = require("../utils/sendEmail");
  sendOTP(user.email, otp).catch((err) =>
    logger.error("Set password OTP error:", err),
  );

  return { message: "OTP sent to your email" };
};

const setPassword = async (userId, { newPassword, otp }) => {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.otp !== otp || new Date(user.otp_expires) < new Date()) {
    throw Object.assign(new Error("Invalid or expired OTP"), { status: 400 });
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  const { error } = await supabase
    .from("users")
    .update({
      password_hash,
      otp: null,
      otp_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
  return { message: "Password set successfully" };
};
module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  changeEmail,
  changeEmailRequest,
  verifyEmailChange,
  updateAvatar,
  requestSetPasswordOTP,
  setPassword,
};
