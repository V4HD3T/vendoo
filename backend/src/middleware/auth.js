const jwt = require("jsonwebtoken");
const authenticate = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required." });
  try { req.user = jwt.verify(h.slice(7), process.env.JWT_SECRET); next(); }
  catch(e) {
    const msg = e.name === "TokenExpiredError" ? "Session has expired." : "Invalid token.";
    res.status(401).json({ error: msg });
  }
};
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required." });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `This action requires the '${roles.join(" or ")}' role.` });
  next();
};
module.exports = { authenticate, requireRole };
