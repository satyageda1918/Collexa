# Database Migration Guide - Roll Number Feature

## Changes Made

### 1. Database Schema
- Added `roll_number` column to `students` table
- Column is UNIQUE and indexed for fast lookups
- Type: VARCHAR(50)

### 2. Models Updated
- `backend/models.py` - Student model now includes roll_number
- `backend/schemas.py` - All student schemas include roll_number
- `backend/routers/admin.py` - User creation validates unique roll numbers

### 3. Migration Scripts Updated
- `backend/fix_db.py` - Automatically adds roll_number column
- `backend/seed_db.py` - Includes roll_number in seed data

## Setup on New Device

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd Collexa-main
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv myenv
myenv\Scripts\activate  # Windows
# or
source myenv/bin/activate  # Linux/Mac

pip install -r requirements.txt
```

### Step 3: Configure Database
Create `.env` file:
```env
DATABASE_URL=mysql+pymysql://username:password@localhost/collexa_db
SECRET_KEY=your-secret-key-here
```

### Step 4: Create Database
```bash
mysql -u root -p
CREATE DATABASE collexa_db;
exit;
```

### Step 5: Run Migrations (IMPORTANT!)
```bash
# This will create all tables and add all required columns
python fix_db.py

# This will seed default users with roll numbers
python seed_db.py
```

### Step 6: Start Server
```bash
uvicorn main:app --reload
```

### Step 7: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

## What Gets Migrated Automatically

When you run `fix_db.py` and `seed_db.py`, the following happens automatically:

### fix_db.py adds:
✓ `admission_staff.access_level` column
✓ `exam_staff.examination_zone` column  
✓ `account_staff.ledger_access` column
✓ `students.roll_number` column (NEW!)
✓ All necessary indexes
✓ Audit columns (created_at, updated_at)

### seed_db.py:
✓ Verifies all columns exist
✓ Creates default users
✓ Assigns roll number to default student (CS2021001)

## Roll Number Format Suggestions

- Computer Science: CS{YEAR}{NUMBER} → CS2021001
- Mechanical: ME{YEAR}{NUMBER} → ME2021001
- Electronics: EC{YEAR}{NUMBER} → EC2021001
- Civil: CE{YEAR}{NUMBER} → CE2021001

## API Changes

### Creating a Student (Admin)
```json
POST /admin/users
{
  "name": "John Doe",
  "email": "john@college.com",
  "password": "Password@123",
  "role": "STUDENT",
  "roll_number": "CS2024001",  // NEW FIELD
  "department": "Computer Science",
  "year": 1,
  "section": "A"
}
```

### Response includes roll_number:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@college.com",
  "role": "STUDENT",
  "student_profile": {
    "roll_number": "CS2024001",  // NEW FIELD
    "department": "Computer Science",
    "year": 1,
    "section": "A"
  }
}
```

## Validation Rules

1. **Unique**: No two students can have the same roll number
2. **Optional**: Roll number can be null (for backward compatibility)
3. **Format**: Up to 50 characters
4. **Indexed**: Fast lookups by roll number

## Troubleshooting

### Error: "Roll number already exists"
- Each roll number must be unique
- Check existing students before assigning

### Error: "Unknown column 'students.roll_number'"
- Run `python fix_db.py` to add the column
- Then run `python seed_db.py`

### Error: "Duplicate entry for key 'roll_number'"
- Roll number must be unique
- Use a different roll number

## Testing

After migration, verify:
```bash
# Check if column exists
mysql -u root -p collexa_db
DESCRIBE students;
# Should show roll_number column

# Check default student
SELECT u.name, s.roll_number FROM users u 
JOIN students s ON u.id = s.user_id;
# Should show CS2021001 for default student
```

## Rollback (If Needed)

If you need to remove the roll_number column:
```sql
ALTER TABLE students DROP COLUMN roll_number;
```

## Summary

✅ Roll number field added to student model
✅ Database migration scripts updated
✅ Validation for unique roll numbers
✅ Backward compatible (roll_number is optional)
✅ Works on any new device after running fix_db.py and seed_db.py
