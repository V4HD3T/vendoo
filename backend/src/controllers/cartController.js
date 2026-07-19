const { pool } = require("../config/db");

const getCart = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.emoji,
              p.price, p.discount, ROUND(p.price*(1-p.discount/100.0)) AS final_price,
              p.stock, c.name AS category_name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE ci.user_id = $1 ORDER BY ci.created_at ASC`,
      [req.user.id]
    );
    const total     = rows.reduce((s, i) => s + Number(i.final_price) * i.quantity, 0);
    const itemCount = rows.reduce((s, i) => s + i.quantity, 0);
    res.json({ items: rows, total: Math.round(total), itemCount });
  } catch(e) { next(e); }
};

const addToCart = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: prods } = await client.query(
      "SELECT id, stock FROM products WHERE id=$1 AND is_active=TRUE FOR UPDATE", [productId]
    );
    if (!prods.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Product not found." }); }
    const { rows: ex } = await client.query(
      "SELECT quantity FROM cart_items WHERE user_id=$1 AND product_id=$2", [userId, productId]
    );
    const existingQty = ex.length ? ex[0].quantity : 0;
    const totalQty    = existingQty + quantity;
    if (prods[0].stock < totalQty) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Not enough stock.", available: Math.max(0, prods[0].stock - existingQty) });
    }
    const { rows } = await client.query(
      `INSERT INTO cart_items(user_id,product_id,quantity)
       VALUES($1,$2,$3)
       ON CONFLICT(user_id,product_id)
       DO UPDATE SET quantity=cart_items.quantity+EXCLUDED.quantity, updated_at=NOW()
       RETURNING *`,
      [userId, productId, quantity]
    );
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch(e) { await client.query("ROLLBACK"); next(e); }
  finally { client.release(); }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const { rows: items } = await pool.query(
      "SELECT ci.id, ci.user_id, p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.id=$1",
      [itemId]
    );
    if (!items.length) return res.status(404).json({ error: "Cart item not found." });
    if (items[0].user_id !== req.user.id) return res.status(403).json({ error: "Not authorized." });
    if (items[0].stock < quantity) return res.status(409).json({ error: "Not enough stock.", available: items[0].stock });
    const { rows } = await pool.query(
      "UPDATE cart_items SET quantity=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [quantity, itemId]
    );
    res.json(rows[0]);
  } catch(e) { next(e); }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM cart_items WHERE id=$1 AND user_id=$2", [req.params.itemId, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: "Item not found or not authorized." });
    res.json({ message: "Item removed from cart." });
  } catch(e) { next(e); }
};

const clearCart = async (req, res, next) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id=$1", [req.user.id]);
    res.json({ message: "Cart cleared." });
  } catch(e) { next(e); }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
