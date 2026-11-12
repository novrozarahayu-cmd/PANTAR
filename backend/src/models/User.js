import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = ["masyarakat", "petugas", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Nama wajib diisi"], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, "Email wajib diisi"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Format email tidak valid"],
    },
    password: { type: String, required: [true, "Password wajib diisi"], select: false },
    role: { type: String, enum: ROLES, default: "masyarakat" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
