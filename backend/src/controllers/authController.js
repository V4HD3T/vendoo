const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { pool } = require("../config/db");

const sign = u => jwt.sign(
  { id: u.id, email: u.email, name: u.name, role: u.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { email, name, password, role = "customer" } = req.body;
    if (!["customer","seller"].includes(role))
      return res.status(400).json({ error: "Invalid role." });
    const { rows: ex } = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (ex.length) return res.status(409).json({ error: "This email is already registered." });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,email,name,role,created_at",
      [email, name, hash, role]
    );
    res.status(201).json({ token: sign(rows[0]), user: rows[0] });
  } catch(e) { next(e); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      "SELECT id,email,name,role,password_hash FROM users WHERE email=$1", [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: "Incorrect email or password." });
    const { password_hash: _, ...safe } = user;
    res.json({ token: sign(safe), user: safe });
  } catch(e) { next(e); }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id,email,name,role,created_at FROM users WHERE id=$1", [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found." });
    res.json(rows[0]);
  } catch(e) { next(e); }
};

module.exports = { register, login, getMe };
