const { pool } = require("../config/db");
const paymentService = require("../services/paymentService");

// POST /api/orders — checkout: turn the caller's cart into an order.
const createOrder = async (req, res, next) => {
  const userId = req.user.id;
  const { shippingAddress } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock every product row the cart touches so a concurrent checkout (or
    // addToCart) can't push stock negative — same fix pattern as
    // cartController.addToCart.
    const { rows: cartRows } = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.seller_id, p.name
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1
       FOR UPDATE OF p`,
      [userId]
    );

    if (!cartRows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty." });
    }

    for (const item of cartRows) {
      if (item.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: `Not enough stock for "${item.name}".`, available: item.stock });
      }
    }

    const subtotal = cartRows.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

    const { rows: [order] } = await client.query(
      `INSERT INTO orders(user_id, shipping_address, subtotal, total_amount)
       VALUES($1,$2,$3,$3) RETURNING *`,
      [userId, shippingAddress, subtotal]
    );

    for (const item of cartRows) {
      await client.query(
        `INSERT INTO order_items(order_id, product_id, seller_id, quantity, unit_price)
         VALUES($1,$2,$3,$4,$5)`,
        [order.id, item.product_id, item.seller_id, item.quantity, item.price]
      );
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [item.quantity, item.product_id]);
    }

    const payment = await paymentService.charge({ amount: subtotal, orderId: order.id });
    if (!payment.success) {
      // Rolls back the stock deduction and order rows too — nothing is
      // committed until payment succeeds.
      await client.query("ROLLBACK");
      return res.status(402).json({ error: "Payment failed." });
    }

    await client.query(
      "UPDATE orders SET payment_status='paid', payment_reference=$1, status='processing' WHERE id=$2",
      [payment.reference, order.id]
    );
    await client.query("UPDATE order_items SET status='processing' WHERE order_id=$1", [order.id]);
    await client.query("DELETE FROM cart_items WHERE user_id=$1", [userId]);

    await client.query("COMMIT");

    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=$1`,
      [order.id]
    );

    res.status(201).json({ ...order, status: "processing", payment_status: "paid", payment_reference: payment.reference, items });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
};

// GET /api/orders — the caller's own order history.
const listMyOrders = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
    res.json(rows);
  } catch(e) { next(e); }
};

// GET /api/orders/:id — a single order the caller owns, with its items.
const getMyOrder = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "Order not found." });
    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id=$1`,
      [req.params.id]
    );
    res.json({ ...rows[0], items });
  } catch(e) { next(e); }
};

// GET /api/orders/seller/items — order items belonging to the calling seller.
const listSellerOrderItems = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT oi.*, p.name AS product_name, o.shipping_address, o.created_at AS ordered_at
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.seller_id=$1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch(e) { next(e); }
};

// PUT /api/orders/items/:itemId/status — seller updates their own item's status.
const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const owns = await pool.query("SELECT id FROM order_items WHERE id=$1 AND seller_id=$2", [req.params.itemId, req.user.id]);
    if (!owns.rows.length) return res.status(404).json({ error: "Order item not found." });
    const { rows } = await pool.query("UPDATE order_items SET status=$1 WHERE id=$2 RETURNING *", [status, req.params.itemId]);
    res.json(rows[0]);
  } catch(e) { next(e); }
};

module.exports = { createOrder, listMyOrders, getMyOrder, listSellerOrderItems, updateOrderItemStatus };
