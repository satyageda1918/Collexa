import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def migrate():
    db_url = os.getenv("DATABASE_URL")
    
    try:
        base_url = db_url.split("://")[1]
        auth_part, host_part = base_url.split("@")
        user, password = auth_part.split(":")
        
        host_and_port = host_part.split("/")[0]
        if ":" in host_and_port:
            host, port = host_and_port.split(":")
            port = int(port)
        else:
            host = host_and_port
            port = 3306
            
        db_name = host_part.split("/")[1]

        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            port=port,
            database=db_name
        )
        
        cursor = connection.cursor()
        print(f"Connected to database: {db_name}")

        def add_column(table, column, definition):
            cursor.execute(f"DESCRIBE {table}")
            cols = [col[0] for col in cursor.fetchall()]
            if column not in cols:
                print(f"Adding column '{column}' to '{table}'...")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

        def add_index(table, column):
            cursor.execute(f"SHOW INDEX FROM {table} WHERE Column_name = '{column}'")
            if not cursor.fetchall():
                print(f"Creating index for '{column}' in '{table}'...")
                cursor.execute(f"CREATE INDEX idx_{table}_{column} ON {table}({column})")

        def modify_column(table, column, definition):
            print(f"Ensuring '{column}' in '{table}' is {definition}")
            cursor.execute(f"ALTER TABLE {table} MODIFY COLUMN {column} {definition}")

        # All tables to ensure audit columns
        all_tables = [
            "users", "students", "teachers", "admission_staff", "exam_staff", 
            "account_staff", "attendance", "marks", "fees", "fee_payments", 
            "feedback", "notifications", "admission_requests"
        ]
        
        for table in all_tables:
            add_column(table, "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
            add_column(table, "updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")

        # Precision
        modify_column("fees", "total_amount", "DECIMAL(12, 2)")
        modify_column("fees", "paid_amount", "DECIMAL(12, 2)")
        modify_column("fees", "due_amount", "DECIMAL(12, 2)")
        modify_column("fee_payments", "amount", "DECIMAL(12, 2)")

        # Critical Indexes for Scale
        add_index("users", "role")
        add_index("users", "email") # Already unique but just in case
        
        # FKs
        fks = [
            ("students", "user_id"),
            ("teachers", "user_id"),
            ("admission_staff", "user_id"),
            ("exam_staff", "user_id"),
            ("account_staff", "user_id"),
            ("attendance", "student_id"),
            ("attendance", "subject_id"),
            ("attendance", "date"),
            ("marks", "student_id"),
            # Marks table indexes handled at creation
            ("fees", "student_id"),
            ("fee_payments", "fee_id"),
            ("fee_payments", "payment_date"),
            ("feedback", "student_id"),
            ("feedback", "teacher_id"),
            ("notifications", "student_id"),
            ("admission_requests", "status")
        ]
        
        for table, col in fks:
            add_index(table, col)

        # New Tables for Exam Cell
        print("Creating system_config table...")
        cursor.execute("DROP TABLE IF EXISTS system_config")
        cursor.execute("""
            CREATE TABLE system_config (
                id INT PRIMARY KEY,
                mark_entry_enabled BOOLEAN DEFAULT FALSE,
                results_published BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Seed default config
        cursor.execute("INSERT INTO system_config (id, mark_entry_enabled, results_published) VALUES (1, FALSE, FALSE)")

        # Recreate Marks table for industrial schema consistency
        print("Migrating marks table...")
        cursor.execute("DROP TABLE IF EXISTS marks")
        cursor.execute("""
            CREATE TABLE marks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                academic_year VARCHAR(20) NOT NULL,
                semester INT NOT NULL,
                subject_code VARCHAR(20) NOT NULL,
                subject_name VARCHAR(100) NOT NULL,
                exam_type VARCHAR(50) NOT NULL,
                department VARCHAR(100) NOT NULL,
                section VARCHAR(10) NOT NULL,
                internal_marks FLOAT DEFAULT 0,
                external_marks FLOAT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX (student_id),
                INDEX (academic_year),
                INDEX (semester),
                INDEX (subject_code),
                INDEX (exam_type),
                INDEX (department),
                INDEX (section),
                INDEX (status)
            )
        """)

        print("Dropping legacy leave_requests and ensuring question_papers schema...")
        cursor.execute("DROP TABLE IF EXISTS leave_requests")
        cursor.execute("DROP TABLE IF EXISTS question_papers")
        cursor.execute("""
            CREATE TABLE question_papers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                subject_name VARCHAR(100) NOT NULL,
                faculty_name VARCHAR(100) NOT NULL,
                semester INT NOT NULL,
                questions_data TEXT,
                file_url VARCHAR(255),
                exam_type VARCHAR(50) DEFAULT 'Regular',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)

        connection.commit()
        print("Scalable industry-standard schema migration COMPLETE.")
        
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()
