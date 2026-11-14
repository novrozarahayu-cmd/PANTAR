import fs from "fs/promises";
import path from "path";

// Menghapus satu file berdasarkan path relatif, misal "uploads/reports/abc.jpg"
export const removeFile = async (relativePath) => {
  try {
    await fs.unlink(path.join(process.cwd(), relativePath));
  } catch (_) {
    // file sudah tidak ada, abaikan
  }
};

export const removeFiles = async (relativePaths = []) => {
  await Promise.all(relativePaths.map(removeFile));
};
