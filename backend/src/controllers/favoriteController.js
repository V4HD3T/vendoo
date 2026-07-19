const { pool } = require("../config/db");

const getFavorites = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.emoji, p.price, p.discount,
              ROUND(p.price*(1-p.discount/100.0)) AS final_price,
              p.stock, p.rating, p.review_count, p.tag,
              c.name AS category_name, f.created_at AS favorited_at
       FROM favorites f
       JOIN products p ON p.id = f.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows, total: rows.length });
  } catch(e) { next(e); }
};

const addFavorite = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const { rows } = await pool.query("SELECT id FROM products WHERE id=$1 AND is_active=TRUE", [productId]);
    if (!rows.length) return res.status(404).json({ error: "Product not found." });
    await pool.query(
      "INSERT INTO favorites(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [req.user.id, productId]
    );
    res.status(201).json({ message: "Added to favorites.", productId });
  } catch(e) { next(e); }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM favorites WHERE user_id=$1 AND product_id=$2",
      [req.user.id, req.params.productId]
    );
    if (!rowCount) return res.status(404).json({ error: "Favorite not found." });
    res.json({ message: "Removed from favorites." });
  } catch(e) { next(e); }
};

const checkFavorite = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT 1 FROM favorites WHERE user_id=$1 AND product_id=$2",
      [req.user.id, req.params.productId]
    );
    res.json({ isFavorite: rows.length > 0 });
  } catch(e) { next(e); }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
