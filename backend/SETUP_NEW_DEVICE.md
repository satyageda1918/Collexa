# Setup Guide for New Device

## Problem
When cloning the project to a new device, the database schema might not match the models, causing errors like:
```
Unknown column 'admission_staff.access_level' in 'field list'
```

## Solution Options

### Option 1: Migrate Existing Database (Preserves Data)
If you have existing data you want to keep:

```bash
cd backend
python migrate_staff_tables.py
```

This will add the missing columns to your existing tables.

### Option 2: Fresh Start (Deletes All Data)
If you want to start with a clean database:

```bash
cd backend
python reset_database.py
python seed_db.py
```

This will:
1. Drop all existing tables
2. Create new tables with correct schema
3. Populate with default test data

## Step-by-Step Setup for New Device

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Collexa-main
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv myenv
   myenv\Scripts\activate  # Windows
   # or
   source myenv/bin/activate  # Linux/Mac
   
   pip install -r requirements.txt
   ```

3. **Configure Database**
   - Create a `.env` file in the backend folder
   - Add your database credentials:
   ```env
   DATABASE_URL=mysql+pymysql://username:password@localhost/collexa_db
   SECRET_KEY=your-secret-key-here
   ```

4. **Create Database**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE collexa_db;
   exit;
   ```

5. **Run Migration**
   ```bash
   # Choose one:
   python migrate_staff_tables.py  # If you have existing data
   # OR
   python reset_database.py        # For fresh start
   python seed_db.py              # Add default users
   ```

6. **Start Backend Server**
   ```bash
   uvicorn main:app --reload
   ```

7. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## Default Login Credentials

After running `seed_db.py`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.com | Admin@123 |
| Student | student@college.com | Student@123 |
| Teacher | teacher@college.com | Teacher@123 |
| Admission | admission@college.com | Admission@123 |
| Exam | exam@college.com | Exam@123 |
| Account | account@college.com | Account@123 |

## Troubleshooting

### Error: "Unknown column in field list"
- Run `python migrate_staff_tables.py`

### Error: "Table doesn't exist"
- Run `python reset_database.py` then `python seed_db.py`

### Error: "Access denied for user"
- Check your `.env` file database credentials
- Ensure MySQL is running
- Verify the database exists

### Error: "No module named 'pymysql'"
- Run `pip install -r requirements.txt`

## Database Schema Sync

The issue occurs because:
1. Your original device has the complete schema
2. The new device only has the base tables without recent columns
3. SQLAlchemy doesn't auto-migrate existing tables

**Solution**: Always run migration scripts when setting up on a new device.
