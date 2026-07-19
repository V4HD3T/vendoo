const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (process.env.NODE_ENV !== "production") console.error(`[${req.method}] ${req.path}`, err.message);
  res.status(status).json({ error: err.message || "Server error." });
};
const notFound = (req, res) =>
  res.status(404).json({ error: `${req.method} ${req.path} not found.` });
module.exports = { errorHandler, notFound };
