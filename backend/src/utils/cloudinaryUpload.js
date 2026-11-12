import cloudinary from "../config/cloudinary.js";

export const uploadFiles = (file, folder) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `pantaujalan/${folder}`,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result) {
                    return reject(new Error("Upload file gagal"));
                }

                resolve({
                    url: result.secure_url,
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                    format: result.format,
                    original_filename: file.originalname,
                });
            },
        );

        stream.end(file.buffer);
    });

export const deleteFiles = async (files = []) => {
    await Promise.all(
        files.map(async (file) => {
            if (!file?.public_id) return;

            const resourceType = file.resource_type || "image";

            const result = await cloudinary.uploader.destroy(file.public_id, {
                resource_type: resourceType,
            });

            if (result.result !== "ok" && result.result !== "not found") {
                throw new Error(`Gagal menghapus file Cloudinary: ${file.public_id}`);
            }
        }),
    );
};
