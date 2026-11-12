import User from "../models/User.js";

export const normalizeEmail = (email) => String(email).toLowerCase().trim();

// Cek apakah email sudah dipakai user lain (user yang sedang diubah dikecualikan)
export const isEmailTaken = async (email, excludeId) => {
  const found = await User.exists({ email: normalizeEmail(email), _id: { $ne: excludeId } });
  return Boolean(found);
};