import User from "../models/User.js";
import { generateToken } from "../utils/token.js";
import { success, created, error } from "../utils/responseFormatter.js";
import { isEmailTaken, normalizeEmail } from "../utils/userHelper.js";

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!password || String(password).length < 8) {
      return error(res, {
        message: "Validasi gagal",
        statusCode: 422,
        errors: [{ field: "password", message: "Password minimal 8 karakter" }],
      });
    }

    const exists = await User.findOne({ email: String(email || "").toLowerCase().trim() });
    if (exists) return error(res, { message: "Email sudah terdaftar", statusCode: 409 });

    // Role tidak diambil dari body, selalu default "masyarakat"
    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    return created(res, { message: "Registrasi berhasil", data: { user, token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, { message: "Email dan password wajib diisi", statusCode: 422 });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    const valid = user && (await user.comparePassword(String(password)));
    if (!valid) return error(res, { message: "Email atau password salah", statusCode: 401 });

    if (!user.isActive) return error(res, { message: "Akun dinonaktifkan", statusCode: 403 });

    const token = generateToken(user);
    return success(res, { message: "Login berhasil", data: { user, token } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const me = (req, res) =>
  success(res, { message: "Profil berhasil diambil", data: req.user });

// PATCH /api/auth/me
// Body opsional: name, email, password, currentPassword (wajib jika password diisi)
export const updateMe = async (req, res, next) => {
  try {
    const { name, email, password, current_password } = req.body;

    const currentPassword = current_password;

    if (name === undefined && email === undefined && password === undefined) {
      return error(res, { message: "Tidak ada data yang diubah", statusCode: 422 });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (name !== undefined) user.name = name;

    if (email !== undefined) {
      const newEmail = normalizeEmail(email);
      if (newEmail !== user.email) {
        if (await isEmailTaken(newEmail, user._id)) {
          return error(res, { message: "Email sudah digunakan", statusCode: 409 });
        }
        user.email = newEmail;
      }
    }

    if (password !== undefined) {
      if (!currentPassword || !(await user.comparePassword(String(currentPassword)))) {
        return error(res, { message: "Password saat ini salah", statusCode: 400 });
      }
      if (String(password).length < 8) {
        return error(res, {
          message: "Validasi gagal",
          statusCode: 422,
          errors: [{ field: "password", message: "Password minimal 8 karakter" }],
        });
      }
      user.password = String(password);
    }

    await user.save();
    return success(res, { message: "Profil berhasil diperbarui", data: user });
  } catch (err) {
    next(err);
  }
};
