-- ─────────────────────────────────────────────────────────────────────────────
-- 001_initial.sql — Vendoo database schema (single file, complete)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS _migrations (
  name       VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  emoji      VARCHAR(10),
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(150),
  password_hash VARCHAR(255),
  is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
  role          VARCHAR(20)  NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','seller')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL        PRIMARY KEY,
  category_id  INT           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  seller_id    UUID          REFERENCES users(id) ON DELETE SET NULL,
  name         VARCHAR(255)  NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  discount     SMALLINT      NOT NULL DEFAULT 0 CHECK (discount BETWEEN 0 AND 100),
  stock        INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  emoji        VARCHAR(10),
  tag          VARCHAR(50),
  rating       NUMERIC(2,1)  NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
  review_count INT           NOT NULL DEFAULT 0,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller   ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_fts ON products USING GIN(to_tsvector('english', name));

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── CART ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id         SERIAL      PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
DROP TRIGGER IF EXISTS trg_cart_updated_at ON cart_items;
CREATE TRIGGER trg_cart_updated_at
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── FAVORITES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

INSERT INTO _migrations (name) VALUES ('001_initial') ON CONFLICT DO NOTHING;
