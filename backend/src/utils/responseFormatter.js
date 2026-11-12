export const success = (
  res,
  { message = "Berhasil", data = null, meta, statusCode = 200 } = {}
) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

export const created = (res, { message = "Data berhasil dibuat", data = null } = {}) =>
  success(res, { message, data, statusCode: 201 });

export const error = (
  res,
  { message = "Terjadi kesalahan pada server", statusCode = 500, errors = null } = {}
) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
