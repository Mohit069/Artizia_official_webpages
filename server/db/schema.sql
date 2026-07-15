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

-- ============================================================
--  ADMIN USERS
--  Passwords are never stored — only a scrypt hash + per-user salt.
--  The first user is seeded from ADMIN_USER/ADMIN_PASSWORD in .env
--  so an existing install keeps working; after that they are managed
--  in the admin panel.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT    NOT NULL UNIQUE,
  pass_hash   TEXT    NOT NULL,
  pass_salt   TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'admin',   -- 'admin' | 'editor'
  created_at  TEXT    DEFAULT (datetime('now')),
  last_login  TEXT
);

-- ============================================================
--  ENQUIRIES — everything submitted from the public site.
--  type: 'contact' (contact page) | 'sample' (sample tray) | 'quote'
--  products holds the chosen surfaces as a JSON array of names.
-- ============================================================
CREATE TABLE IF NOT EXISTS enquiries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL DEFAULT 'contact',
  name         TEXT,
  email        TEXT,
  phone        TEXT,
  subject      TEXT,
  message      TEXT,
  address      TEXT,
  project_type TEXT,
  area         TEXT,
  products     TEXT,                               -- JSON array
  status       TEXT NOT NULL DEFAULT 'new',        -- 'new' | 'read' | 'archived'
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_enq_created ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enq_status  ON enquiries(status);

-- ============================================================
--  PAGES — block-built pages created in the admin panel.
--  `sections` is a JSON array of blocks: [{type, ...fields}]
--  Block types are declared in server/blocks.js and rendered by
--  assets/js/blocks.js, so adding one means editing those two files.
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  title       TEXT    NOT NULL,
  nav_label   TEXT,                                -- shown in the nav when in_nav = 1
  in_nav      INTEGER NOT NULL DEFAULT 0,
  status      TEXT    NOT NULL DEFAULT 'draft',    -- 'draft' | 'published'
  seo_title   TEXT,
  seo_desc    TEXT,
  og_image    TEXT,
  sections    TEXT    NOT NULL DEFAULT '[]',       -- JSON array of blocks
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pages_slug   ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);

-- ============================================================
--  POSTS — blog articles. `body` is sanitised rich-text HTML.
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  title        TEXT    NOT NULL,
  excerpt      TEXT,
  cover        TEXT,
  author       TEXT,
  tags         TEXT    NOT NULL DEFAULT '[]',      -- JSON array
  body         TEXT    NOT NULL DEFAULT '',        -- rich-text HTML
  status       TEXT    NOT NULL DEFAULT 'draft',   -- 'draft' | 'published'
  seo_title    TEXT,
  seo_desc     TEXT,
  published_at TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_slug      ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status    ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at DESC);

-- ============================================================
--  PAGE CONTENT — inline edits to the hand-built marketing pages
--  (Home, About, Collections, …). One row per page; `data` is a
--  JSON map of { "<field-key>": "<value>" } where a field key like
--  "hero.title" matches a data-edit attribute in that page's markup.
--  Image fields store the URL; their alt text is a sibling key,
--  e.g. "hero.image" + "hero.image__alt".
-- ============================================================
CREATE TABLE IF NOT EXISTS page_content (
  page        TEXT PRIMARY KEY,                 -- 'index' | 'about' | 'collections' | …
  data        TEXT NOT NULL DEFAULT '{}',       -- JSON map of overrides
  updated_at  TEXT DEFAULT (datetime('now'))
);
