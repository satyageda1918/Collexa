from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import models, schemas, auth, database, dependencies
import json
from database import engine, get_db
from routers import student, teacher, admin, staff, ai

try:
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Error creating database tables: {e}")
    # Don't raise here yet, let's see if the app can still start

app = FastAPI(title="College ERP System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from websocket_manager import manager

# We attach it to app state so routers can access it
app.state.ws_manager = manager

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # We simply keep the connection alive. Client can send pings.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role.value, "id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(dependencies.get_current_user)):
    return current_user

# Include routers
app.include_router(student.router, prefix="/student", tags=["student"])
app.include_router(teacher.router, prefix="/teacher", tags=["teacher"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(staff.router, prefix="/staff", tags=["staff"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Welcome to College ERP API"}
