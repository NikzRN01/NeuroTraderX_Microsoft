-- PostgreSQL schema for NeuroTraderX
-- Matches the SQLAlchemy models in server/app.py

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  financial_goal VARCHAR(200),
  risk_tolerance VARCHAR(100),
  investment_preference VARCHAR(200),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);

-- Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  purchase_price DOUBLE PRECISION NOT NULL,
  purchase_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_portfolios_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_portfolios_user_id ON portfolios (user_id);

-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  target_price DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_watchlists_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_watchlists_user_id ON watchlists (user_id);
