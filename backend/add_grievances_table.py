from database import engine, Base
from models import Grievance

# Create the grievances table
Base.metadata.create_all(bind=engine, tables=[Grievance.__table__])
print("Grievances table created successfully!")
