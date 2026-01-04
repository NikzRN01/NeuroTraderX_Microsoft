# PostgreSQL Database Setup Guide

## ✅ Completed Steps

1. ✅ Created Azure Database for PostgreSQL Flexible Server
2. ✅ Updated Flask app to use PostgreSQL
3. ✅ Added database models for Portfolio and Watchlist
4. ✅ Added psycopg2-binary driver to requirements.txt
5. ✅ Created .env configuration

## 🔧 Next Steps

### 1. Update .env File with Your Password

Edit `server/.env` and replace `{your_password}` with your actual PostgreSQL password:

```bash
DATABASE_URL=postgresql://neuroadmin:YOUR_ACTUAL_PASSWORD@neurotradex.postgres.database.azure.com:5432/postgres?sslmode=require
```

### 2. Install Dependencies

```powershell
cd server
pip install -r requirements.txt
```

### 3. Test Database Connection

Run this PowerShell command to verify connection:

```powershell
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database tables created successfully!')"
```

### 4. Start Flask Server

```powershell
python app.py
```

## 📊 Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `password`: User password (TODO: Hash in production)
- `financial_goal`: Investment goals
- `risk_tolerance`: Risk level
- `investment_preference`: Investment preferences
- `created_at`: Account creation timestamp

### Portfolios Table
- `id`: Primary key
- `user_id`: Foreign key to Users
- `ticker`: Stock symbol
- `quantity`: Number of shares
- `purchase_price`: Price per share at purchase
- `purchase_date`: Purchase timestamp
- `notes`: User notes
- `created_at`, `updated_at`: Timestamps

### Watchlists Table
- `id`: Primary key
- `user_id`: Foreign key to Users
- `ticker`: Stock symbol
- `target_price`: Target price alert
- `notes`: User notes
- `created_at`: Timestamp

## 🔒 Security Notes

**Important**: Current implementation stores passwords in plain text. For production:
1. Use `werkzeug.security` to hash passwords
2. Implement JWT tokens for authentication
3. Add input validation
4. Enable SSL/TLS enforcement in Azure PostgreSQL

## 🌐 Azure PostgreSQL Configuration

**Connection Details:**
- **Host**: neurotradex.postgres.database.azure.com
- **Port**: 5432
- **Database**: postgres
- **Username**: neuroadmin
- **SSL Mode**: require

**Free Tier Benefits:**
- ✅ 12 months free
- ✅ B1ms tier (1 vCore, 2 GiB RAM)
- ✅ 32 GiB storage
- ✅ Automated backups

## 📝 Example API Usage

### Add Stock to Portfolio
```bash
POST /api/portfolio
{
  "user_id": 1,
  "ticker": "AAPL",
  "quantity": 10,
  "purchase_price": 150.50
}
```

### Add to Watchlist
```bash
POST /api/watchlist
{
  "user_id": 1,
  "ticker": "MSFT",
  "target_price": 350.00
}
```

## 🆘 Troubleshooting

**Connection Error**: Verify your IP is whitelisted in Azure Portal → PostgreSQL → Networking

**SSL Error**: Ensure `?sslmode=require` is in DATABASE_URL

**Import Error**: Run `pip install psycopg2-binary`

**Migration Issues**: Drop and recreate tables with `db.drop_all(); db.create_all()`
