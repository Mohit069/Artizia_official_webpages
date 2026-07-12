-- ============================================================
--  ARTIZIA — products schema
--  New products added via the admin API are stored here too;
--  the table is the single source of truth.
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL UNIQUE,
  code          TEXT,
  name          TEXT    NOT NULL,
  collection    TEXT,
  description   TEXT,
  vein          TEXT,               -- design label, e.g. "Long Vein, Natural"
  grain         TEXT,
  finish        TEXT,
  thickness     TEXT,
  applications  TEXT,               -- JSON array of strings

  -- uploaded image URLs (files live in server/uploads, DB stores paths only)
  image_full_slab   TEXT,
  image_closeup     TEXT,
  image_application TEXT,
  image_detail      TEXT,

  -- "auto marble" fallback palette (used when a product has no photos)
  pal_base   TEXT,
  pal_vein   TEXT,
  pal_glow   TEXT,
  pal_seed   REAL,
  pal_flow   REAL,
  pal_sharp  REAL,
  pal_dark   REAL,

  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_slug       ON products(slug);
