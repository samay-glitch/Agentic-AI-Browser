from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_browser_agent
from typing import Dict, Any, Optional
import uuid
import sqlite3

app = FastAPI(title="Agentic AI Browser Backend")

DB_FILE = "browser.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY DEFAULT 1,
            name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            resume_text TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# In-memory data stores for tasks
tasks: Dict[str, Dict[str, Any]] = {}
task_queues: Dict[str, asyncio.Queue] = {}

# Pydantic models for request/response validation
class UserProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    resume_text: Optional[str] = None

class CommandRequest(BaseModel):
    command: str

class CommandResponse(BaseModel):
    task_id: str

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: int
    result: Optional[str] = None
    error: Optional[str] = None

@app.get("/")
async def root():
    """
    Root endpoint that provides a simple welcome message.
    """
    return {
        "message": "Welcome to the Agentic AI Browser Backend!",
        "docs": "Visit /docs for the API documentation."
    }

@app.post("/command", response_model=CommandResponse)
async def receive_command(request: CommandRequest, background_tasks: BackgroundTasks):
    """
    Receives a text command, starts the LangChain agent in the background, 
    and returns a unique task_id instantly.
    """
    task_id = str(uuid.uuid4())
    # Initialize the task in memory
    tasks[task_id] = {
        "status": "pending",
        "progress": 0,
        "command": request.command,
        "logs": []
    }
    task_queues[task_id] = asyncio.Queue()
    
    # Trigger the background task passing the tasks dictionary
    background_tasks.add_task(run_browser_agent, task_id, request.command, tasks, task_queues[task_id])
    
    return CommandResponse(task_id=task_id)

@app.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Returns the progress and status of a given task_id.
    """
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task_data = tasks[task_id]
    return TaskStatusResponse(
        task_id=task_id,
        status=task_data["status"],
        progress=task_data["progress"],
        result=task_data.get("result"),
        error=task_data.get("error")
    )

@app.websocket("/ws/status/{task_id}")
async def websocket_status(websocket: WebSocket, task_id: str):
    await websocket.accept()
    
    if task_id not in tasks:
        await websocket.close(code=1008, reason="Task not found")
        return
        
    queue = task_queues.get(task_id)
    
    try:
        # Send the current state immediately upon connecting
        await websocket.send_json(tasks[task_id])
        
        if not queue:
            await websocket.close()
            return

        while True:
            # Wait for a new update from the agent's queue
            update = await queue.get()
            await websocket.send_json(update)
            
            # If the task reached a terminal state, we can finish
            if update.get("status") in ["completed", "failed"]:
                break
    except WebSocketDisconnect:
        print(f"Client disconnected from task {task_id}")

@app.get("/user/profile")
async def get_user_profile():
    """
    Reads the user profile from SQLite.
    """
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT name, email, phone, address, resume_text FROM user_profile WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return {}

@app.post("/user/profile")
async def update_user_profile(profile_update: UserProfileRequest):
    """
    Writes/updates the user profile in SQLite.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if a profile exists
    cursor.execute("SELECT id FROM user_profile WHERE id = 1")
    row = cursor.fetchone()
    
    # Extract only the fields that were provided in the request
    update_data = profile_update.model_dump(exclude_unset=True)
    
    if not row:
        # Insert new record
        fields = ["id"] + list(update_data.keys())
        values = [1] + list(update_data.values())
        placeholders = ",".join(["?"] * len(fields))
        query = f"INSERT INTO user_profile ({','.join(fields)}) VALUES ({placeholders})"
        cursor.execute(query, values)
    else:
        # Update existing record if there are fields to update
        if update_data:
            set_clause = ", ".join([f"{k} = ?" for k in update_data.keys()])
            query = f"UPDATE user_profile SET {set_clause} WHERE id = 1"
            cursor.execute(query, list(update_data.values()))
            
    conn.commit()
    
    # Fetch and return the updated profile
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT name, email, phone, address, resume_text FROM user_profile WHERE id = 1")
    updated_row = cursor.fetchone()
    conn.close()
    
    return {"message": "Profile updated successfully", "profile": dict(updated_row)}

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
