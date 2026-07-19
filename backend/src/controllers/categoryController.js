const { pool } = require("../config/db");

const getCategories = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.slug, c.emoji, c.sort_order,
              COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.sort_order ASC`
    );
    res.json(rows);
  } catch(e) { next(e); }
};

module.exports = { getCategories };
