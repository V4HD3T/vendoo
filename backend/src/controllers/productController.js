const { pool } = require("../config/db");

const COLS = `
  p.id, p.name, p.description, p.price, p.discount,
  ROUND(p.price * (1 - p.discount / 100.0)) AS final_price,
  p.stock, p.emoji, p.tag, p.rating, p.review_count,
  p.seller_id, p.category_id, p.created_at,
  c.name AS category_name, c.slug AS category_slug,
  u.name AS seller_name
`;

const ORDER_MAP = {
  featured:   "p.review_count DESC",
  price_asc:  "final_price ASC",
  price_desc: "final_price DESC",
  rating:     "p.rating DESC",
  reviews:    "p.review_count DESC",
  newest:     "p.created_at DESC",
};

const getProducts = async (req, res, next) => {
  try {
    const { category, search, sort = "featured",
            page = "1", limit = "20", sellerId } = req.query;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset   = (pageNum - 1) * limitNum;
    const cond = ["p.is_active = TRUE"], vals = []; let vi = 1;
    if (category) { cond.push(`c.slug = $${vi++}`); vals.push(category); }
    if (sellerId)  { cond.push(`p.seller_id = $${vi++}`); vals.push(sellerId); }
    if (search?.trim()) {
      cond.push(`(to_tsvector('english', p.name) @@ plainto_tsquery('english', $${vi}) OR p.name ILIKE $${vi+1})`);
      vals.push(search.trim(), `%${search.trim()}%`); vi += 2;
    }
    const where   = "WHERE " + cond.join(" AND ");
    const orderBy = ORDER_MAP[sort] || ORDER_MAP.featured;
    const [dr, cr] = await Promise.all([
      pool.query(
        `SELECT ${COLS} FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=p.seller_id ${where} ORDER BY ${orderBy} LIMIT $${vi} OFFSET $${vi+1}`,
        [...vals, limitNum, offset]
      ),
      pool.query(`SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id=p.category_id ${where}`, vals),
    ]);
    const total = parseInt(cr.rows[0].total);
    res.json({ data: dr.rows, meta: { total, page: pageNum, limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum), hasPrev: pageNum > 1 } });
  } catch(e) { next(e); }
};

const getProductById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN users u ON u.id=p.seller_id WHERE p.id=$1 AND p.is_active=TRUE`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Product not found." });
    res.json(rows[0]);
  } catch(e) { next(e); }
};

const getProductsByCategory = (req, res, next) => {
  req.query.category = req.params.slug;
  return getProducts(req, res, next);
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discount = 0, stock, emoji, tag, categoryId } = req.body;
    const { rows: cats } = await pool.query("SELECT id FROM categories WHERE id=$1", [categoryId]);
    if (!cats.length) return res.status(404).json({ error: "Category not found." });
    const { rows } = await pool.query(
      "INSERT INTO products(category_id,name,description,price,discount,stock,emoji,tag,seller_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [categoryId, name, description, price, discount, stock, emoji, tag || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch(e) { next(e); }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: ex } = await pool.query("SELECT seller_id FROM products WHERE id=$1 AND is_active=TRUE", [id]);
    if (!ex.length) return res.status(404).json({ error: "Product not found." });
    if (ex[0].seller_id !== req.user.id) return res.status(403).json({ error: "You are not authorized to edit this product." });
    const { name, description, price, discount, stock, emoji, tag, categoryId } = req.body;
    const { rows } = await pool.query(
      "UPDATE products SET name=$1,description=$2,price=$3,discount=$4,stock=$5,emoji=$6,tag=$7,category_id=$8,updated_at=NOW() WHERE id=$9 RETURNING *",
      [name, description, price, discount, stock, emoji, tag || null, categoryId, id]
    );
    res.json(rows[0]);
  } catch(e) { next(e); }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: ex } = await pool.query("SELECT seller_id FROM products WHERE id=$1 AND is_active=TRUE", [id]);
    if (!ex.length) return res.status(404).json({ error: "Product not found." });
    if (ex[0].seller_id !== req.user.id) return res.status(403).json({ error: "You are not authorized to delete this product." });
    await pool.query("UPDATE products SET is_active=FALSE,updated_at=NOW() WHERE id=$1", [id]);
    res.json({ message: "Product removed." });
  } catch(e) { next(e); }
};

module.exports = { getProducts, getProductById, getProductsByCategory, createProduct, updateProduct, deleteProduct };
