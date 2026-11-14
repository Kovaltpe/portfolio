CREATE TABLE IF NOT EXISTS demo_orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  currency TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demo_order_items (
  order_id TEXT NOT NULL REFERENCES demo_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS demo_order_items_order_id
  ON demo_order_items(order_id);
