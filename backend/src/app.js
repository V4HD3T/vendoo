require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const { testConnection } = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",").map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error("Blocked by CORS")),
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

// Health check — also verifies the database connection
app.get("/health", async (_req, res, next) => {
  try {
    const { pool } = require("./config/db");
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok", time: new Date().toISOString() });
  } catch (e) {
    next(Object.assign(e, { status: 503 }));
  }
});

// API Routes
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/products",   require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/cart",       require("./routes/cart"));
app.use("/api/favorites",  require("./routes/favorites"));

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => console.log(`\n🚀 API ready → http://localhost:${PORT}\n`));
  } catch (e) {
    console.error("❌ Startup error:", e.message);
    process.exit(1);
  }
};

start();
