# Architecture Overview: Agentic AI Browser

This document outlines the high-level architecture of the Agentic AI Browser system, illustrating the flow of commands from the user interface down to external API integrations.

## System Architecture Diagram

```mermaid
flowchart TD
    %% Define Styles
    classDef frontend fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc
    classDef backend fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f8fafc
    classDef agent fill:#064e3b,stroke:#22c55e,stroke-width:2px,color:#f8fafc
    classDef external fill:#451a03,stroke:#eab308,stroke-width:2px,color:#f8fafc
    classDef data fill:#171717,stroke:#64748b,stroke-width:2px,color:#f8fafc

    %% Nodes
    UI["💻 React UI (Vite)\nCommand Input & Live Logs"]:::frontend
    API["⚡ FastAPI Backend\nREST & WebSockets"]:::backend
    DB[("🗄️ SQLite DB\nUser Profile & Memory")]:::data
    
    subgraph AgentSystem ["🤖 Agent System"]
        AgentExec["⚙️ AgentExecutor\n(LangGraph ReAct)"]:::agent
        LLM["🧠 LLM\n(Gemini 2.5 Flash)"]:::agent
        Tools["🔧 Tool Suite\n(Browser & OS)"]:::agent
        Memory["💭 Short-term Memory\n(Context & State)"]:::agent
    end
    
    ExtWeb["🌐 Web Pages\n(DOM Interaction)"]:::external
    ExtAPI["🔌 External APIs\n(Gmail, etc.)"]:::external

    %% Relationships
    UI -- "POST /command" --> API
    UI -- "WS /ws/status" <--> API
    
    API -- "Spawns Background Task" --> AgentExec
    API -- "CRUD" --> DB
    
    AgentExec -- "Prompts & Context" --> LLM
    LLM -- "Reasons & Chooses Action" --> AgentExec
    AgentExec -- "Executes" --> Tools
    AgentExec -- "Reads/Writes" --> Memory
    Tools -- "Reads" --> DB
    
    Tools -- "Playwright (Navigate, Click, Type)" --> ExtWeb
    Tools -- "HTTP/SDKs" --> ExtAPI
```

## Component Details

### 1. React UI (`Vite`)
- **Role**: The control center for the user.
- **Responsibilities**: 
  - Captures natural language commands from the user.
  - Subscribes to real-time updates via WebSockets.
  - Visualizes the agent's step-by-step thought process, status, and progress.
  - Manages the user's persistent profile (Settings).

### 2. FastAPI Backend
- **Role**: The orchestration and communication bridge.
- **Responsibilities**:
  - Exposes REST endpoints (`POST /command`, `GET/POST /user/profile`).
  - Manages active WebSocket connections for live logging.
  - Offloads long-running agent tasks to `BackgroundTasks` to prevent blocking the event loop.
  - Interfaces with the SQLite database for basic CRUD operations.

### 3. Agent System (`LangGraph / LangChain`)
- **AgentExecutor**: The core loop that implements the ReAct (Reason + Act) prompting strategy. It manages the state machine of the task.
- **LLM**: Google's Gemini 2.5 Flash serves as the brain, parsing user intent, deciding which tool to use, and determining when a task is complete.
- **Tool Suite**: 
  - **Browser Tools**: Powered by Playwright to navigate URLs, click elements, and inject text.
  - **Memory Tools**: Tools capable of reading from the user profile database (e.g., retrieving the user's resume or address for auto-filling).
- **Memory**: Short-term conversation history and intermediate scratchpad used by the agent to retain context between steps.

### 4. External Integrations
- **Web Pages**: The actual DOM of external websites the agent interacts with via Chromium (Playwright).
- **External APIs**: Third-party services the agent might interact with directly without a browser (e.g., sending an email via SMTP/Gmail API if a tool is provided).
