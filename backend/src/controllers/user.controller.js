import mongoose from "mongoose";
import User, { ROLES } from "../models/User.js";
import { success, error } from "../utils/responseFormatter.js";
import { getPagination, buildMeta } from "../utils/paginator.js";
import { isEmailTaken, normalizeEmail } from "../utils/userHelper.js";

// GET /api/users (admin)
export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [items, totalItems] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return success(res, {
      message: "Daftar user berhasil diambil",
      data: items,
      meta: buildMeta({ page, limit, totalItems }),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return error(res, { message: "ID user tidak valid", statusCode: 400 });
    }
    const user = await User.findById(id);
    if (!user) return error(res, { message: "User tidak ditemukan", statusCode: 404 });

    return success(res, { message: "Detail user berhasil diambil", data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role (admin)
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, { message: "ID user tidak valid", statusCode: 400 });
    }
    if (!ROLES.includes(role)) {
      return error(res, { message: `Role harus salah satu dari: ${ROLES.join(", ")}`, statusCode: 422 });
    }
    if (id === req.user.id) {
      return error(res, { message: "Tidak dapat mengubah role akun sendiri", statusCode: 400 });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
    if (!user) return error(res, { message: "User tidak ditemukan", statusCode: 404 });

    return success(res, { message: "Role user berhasil diperbarui", data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id (admin)
// Body opsional: name, email, password. Admin tidak perlu password lama.
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, { message: "ID user tidak valid", statusCode: 400 });
    }
    if (name === undefined && email === undefined && password === undefined) {
      return error(res, { message: "Tidak ada data yang diubah", statusCode: 422 });
    }

    const user = await User.findById(id);
    if (!user) return error(res, { message: "User tidak ditemukan", statusCode: 404 });

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
    return success(res, { message: "Data user berhasil diperbarui", data: user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id (admin)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return error(res, { message: "ID user tidak valid", statusCode: 400 });
    }
    if (id === req.user.id) {
      return error(res, { message: "Tidak dapat menghapus akun sendiri", statusCode: 400 });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return error(res, { message: "User tidak ditemukan", statusCode: 404 });

    return success(res, { message: "User berhasil dihapus", data: null });
  } catch (err) {
    next(err);
  }
};
