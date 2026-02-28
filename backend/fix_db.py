import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def fix_db():
    db_url = os.getenv("DATABASE_URL")
    # mysql+pymysql://root:password@localhost:3306/college_erp
    
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
        
        # Check leave_requests columns
        cursor.execute("DESCRIBE leave_requests")
        columns = [col[0] for col in cursor.fetchall()]
        
        if 'start_date' not in columns:
            print("Adding 'start_date' to leave_requests...")
            cursor.execute("ALTER TABLE leave_requests ADD COLUMN start_date DATE AFTER reason")
        
        if 'end_date' not in columns:
            print("Adding 'end_date' to leave_requests...")
            cursor.execute("ALTER TABLE leave_requests ADD COLUMN end_date DATE AFTER start_date")
            
        # Check students columns
        cursor.execute("DESCRIBE students")
        columns = [col[0] for col in cursor.fetchall()]
        
        if 'phone_number' not in columns:
            print("Adding 'phone_number' to students...")
            cursor.execute("ALTER TABLE students ADD COLUMN phone_number VARCHAR(20) AFTER section")
            
        if 'address' not in columns:
            print("Adding 'address' to students...")
            cursor.execute("ALTER TABLE students ADD COLUMN address TEXT AFTER phone_number")

        # Check teachers columns
        cursor.execute("DESCRIBE teachers")
        columns = [col[0] for col in cursor.fetchall()]
        
        if 'phone_number' not in columns:
            print("Adding 'phone_number' to teachers...")
            cursor.execute("ALTER TABLE teachers ADD COLUMN phone_number VARCHAR(20) AFTER department")
            
        if 'address' not in columns:
            print("Adding 'address' to teachers...")
            cursor.execute("ALTER TABLE teachers ADD COLUMN address TEXT AFTER phone_number")

        connection.commit()
        print("Database schema fixed successfully!")
        
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Error fixing database: {e}")

if __name__ == "__main__":
    fix_db()
