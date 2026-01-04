# Server setup (Flask API)

## Environment (.env)

The backend reads the database connection string from:

- `DB` (preferred)
- `DATABASE_URL` (backward compatible)

Create `server/.env`:

```powershell
cd server
Copy-Item .env.example .env
```

Then edit `server/.env` and set `DB` to your PostgreSQL connection string.

### Example (Azure PostgreSQL)

```dotenv
DB=postgresql://neuroadmin:YOUR_ACTUAL_PASSWORD@neurotradex.postgres.database.azure.com:5432/postgres?sslmode=require
```

## Install dependencies

```powershell
cd server
pip install -r requirements.txt
```

## Initialize tables / test DB connection

```powershell
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database tables created successfully!')"
```

## Run the API

```powershell
python app.py
```

## Docker Compose notes

If you run the backend via `docker-compose.yml`, set `DB=...` in the project-root `.env` (Compose reads it automatically) so the container receives it via the `environment:` section.
