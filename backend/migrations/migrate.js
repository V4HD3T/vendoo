require("dotenv").config();
const fs   = require("fs");
const path = require("path");
const { pool } = require("../src/config/db");

const FILES = ["001_initial.sql", "002_add_orders.sql"];

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    for (const file of FILES) {
      const name = file.replace(".sql", "");
      const { rows } = await client.query("SELECT 1 FROM _migrations WHERE name=$1", [name]);
      if (rows.length) { console.log(`⏭️  Skipped: ${file}`); continue; }
      const sql = fs.readFileSync(path.join(__dirname, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`✅ Applied: ${file}`);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
    console.log("\n🎉 Migration complete.");
  } catch (e) {
    console.error("❌ Migration error:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
