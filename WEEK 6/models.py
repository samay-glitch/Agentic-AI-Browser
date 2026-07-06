from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserProfile(BaseModel):
    """Represents a user's persistent profile in the system."""
    id: Optional[int] = None
    name: str = Field(description="Full name of the user")
    email: str = Field(description="Email address of the user")
    phone: Optional[str] = Field(default=None, description="Phone number")
    address: Optional[str] = Field(default=None, description="Physical address")
    resume_text: Optional[str] = Field(default=None, description="Plain text resume or bio")

class AgentAction(BaseModel):
    """Represents a single granular action taken by the agent."""
    action_type: str = Field(description="The type of action (e.g., navigate, click, type, summarize)")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters required to execute the action")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the action was initiated")
    status: str = Field(default="pending", description="Status of the action (pending, success, failed)")
    result: Optional[str] = Field(default=None, description="Output or observation resulting from the action")

class Task(BaseModel):
    """Represents an overarching goal or command submitted by the user."""
    task_id: str = Field(description="Unique identifier for the task")
    command: str = Field(description="The natural language command from the user")
    status: str = Field(default="pending", description="Current status of the task (pending, in_progress, completed, failed)")
    progress: int = Field(default=0, ge=0, le=100, description="Completion percentage (0-100)")
    logs: List[str] = Field(default_factory=list, description="Raw log entries of the agent's execution")
    actions: List[AgentAction] = Field(default_factory=list, description="Structured actions taken during the task")
    result: Optional[str] = Field(default=None, description="The final answer or result string")
    error: Optional[str] = Field(default=None, description="Error message if the task failed")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When the task was created")
