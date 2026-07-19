-- 002_add_orders.sql
-- Adds order placement and per-seller order-item tracking.

CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL        PRIMARY KEY,
  user_id           UUID          NOT NULL REFERENCES users(id),
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  payment_status    VARCHAR(20)   NOT NULL DEFAULT 'pending'
                       CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_reference VARCHAR(255),
  shipping_address  TEXT          NOT NULL,
  subtotal          NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  total_amount      NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- product_id/order_id are INT to match the existing SERIAL primary keys on
-- products/orders; seller_id is UUID to match users(id), same as
-- products.seller_id. seller_id is denormalized here (copied from the
-- product at purchase time) so a seller's order queue stays correct and
-- fast even if the product is later reassigned or deactivated.
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL        PRIMARY KEY,
  order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT           NOT NULL REFERENCES products(id),
  seller_id  UUID          REFERENCES users(id),
  quantity   INT           NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  status     VARCHAR(20)   NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user       ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO _migrations (name) VALUES ('002_add_orders') ON CONFLICT DO NOTHING;
