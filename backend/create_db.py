import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def create_db():
    db_url = os.getenv("DATABASE_URL")
    # Expected format: mysql+pymysql://user:password@host:port/dbname
    # We need to extract connection info to create the DB first
    
    try:
        # Extract components from URL
        # mysql+pymysql://root:password@localhost:3306/college_erp
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

        # Connect to MySQL server
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            port=port
        )
        
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        print(f"Database '{db_name}' created or already exists.")
        
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Error creating database: {e}")
        print("Please ensure your MySQL server is running and your DATABASE_URL in .env is correct.")

if __name__ == "__main__":
    create_db()
