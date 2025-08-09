# This server shows how you can use the unique identifier for users sent by puch in every tool call.
# This server is a task management mcp server where you can manage tasks for a user, using `puch_user_id` as a unique identifier for that user.

import asyncio
from typing import Annotated, Optional, Literal
import os, uuid, json
from datetime import datetime
from dotenv import load_dotenv

from fastmcp import FastMCP
from fastmcp.server.auth.providers.bearer import BearerAuthProvider, RSAKeyPair
from mcp.server.auth.provider import AccessToken
from mcp import ErrorData, McpError
from mcp.types import TextContent, INVALID_PARAMS, INTERNAL_ERROR
from pydantic import Field, BaseModel  # <-- add BaseModel

# --- Env ---
load_dotenv()
TOKEN = os.environ.get("AUTH_TOKEN")
MY_NUMBER = os.environ.get("MY_NUMBER")
assert TOKEN, "Please set AUTH_TOKEN in your .env file"
assert MY_NUMBER is not None, "Please set MY_NUMBER in your .env file"


# --- Auth ---
class SimpleBearerAuthProvider(BearerAuthProvider):
    def __init__(self, token: str):
        k = RSAKeyPair.generate()
        super().__init__(
            public_key=k.public_key, jwks_uri=None, issuer=None, audience=None
        )
        self.token = token

    async def load_access_token(self, token: str) -> AccessToken | None:
        if token == self.token:
            return AccessToken(
                token=token, client_id="task-client", scopes=["*"], expires_at=None
            )
        return None


mcp = FastMCP(
    "Task Management MCP Server",
    auth=SimpleBearerAuthProvider(TOKEN),
)

# since its a starter, we can use an in memory dict as a db
TASKS: dict[str, dict[str, dict]] = {}


def _now() -> str:
    return datetime.utcnow().isoformat()


def _user_tasks(puch_user_id: str) -> dict[str, dict]:
    if not puch_user_id:
        raise McpError(
            ErrorData(code=INVALID_PARAMS, message="puch_user_id is required")
        )
    return TASKS.setdefault(puch_user_id, {})


def _error(code, msg):
    raise McpError(ErrorData(code=code, message=msg))


# --- Rich Tool Description model ---
class RichToolDescription(BaseModel):
    description: str
    use_when: str
    side_effects: str | None = None


# --- Tool: validate (required by Puch) ---
@mcp.tool
async def validate() -> str:
    return MY_NUMBER


# --- Tool descriptions (rich) ---
ADD_TASK_DESCRIPTION = RichToolDescription(
    description="Create a new task for a specific user (by puch_user_id).",
    use_when="The user wants to add a task with title and optional due date, priority, tags, or notes.",
    side_effects="Adds a task to the user's task list.",
)

LIST_TASKS_DESCRIPTION = RichToolDescription(
    description="List a user's tasks with optional filters (status, tag, search).",
    use_when="The user asks to view tasks, possibly filtered by completion status, tag, or a search term.",
    side_effects="Reads tasks from memory and returns them sorted by due_at then created_at.",
)

GET_TASK_DESCRIPTION = RichToolDescription(
    description="Fetch a single task by its ID for a given user.",
    use_when="The user needs to inspect one task's details given its ID.",
    side_effects="None.",
)

COMPLETE_TASK_DESCRIPTION = RichToolDescription(
    description="Mark a user's task as completed by ID.",
    use_when="The user indicates a task is done and provides or implies the task ID.",
    side_effects="Updates task status to completed and updates the timestamp.",
)

REMOVE_TASK_DESCRIPTION = RichToolDescription(
    description="Delete a user's task by ID.",
    use_when="The user wants to remove or delete a task.",
    side_effects="Permanently removes the task from storage.",
)


# --- Tools ---
@mcp.tool(description=ADD_TASK_DESCRIPTION.model_dump_json())
async def add_task(
    puch_user_id: Annotated[str, Field(description="Puch User Unique Identifier")],
    title: Annotated[str, Field(description="Task title")],
    due_at: Annotated[Optional[str], Field(description="ISO 8601 datetime")] = None,
    priority: Annotated[
        Optional[Literal["low", "normal", "high"]], Field(description="Priority")
    ] = "normal",
    tags: Annotated[Optional[list[str]], Field(description="List of tags")] = None,
    notes: Annotated[Optional[str], Field(description="Notes")] = None,
) -> list[TextContent]:
    try:
        if not title or not title.strip():
            _error(INVALID_PARAMS, "title cannot be empty")
        user_tasks = _user_tasks(puch_user_id)
        tid = str(uuid.uuid4())
        now = _now()
        task = {
            "id": tid,
            "title": title.strip(),
            "status": "open",
            "due_at": due_at,
            "priority": priority or "normal",
            "tags": tags or [],
            "notes": notes,
            "created_at": now,
            "updated_at": now,
        }
        user_tasks[tid] = task
        return [TextContent(type="text", text=json.dumps(task))]
    except McpError:
        raise
    except Exception as e:
        _error(INTERNAL_ERROR, str(e))


@mcp.tool(description=LIST_TASKS_DESCRIPTION.model_dump_json())
async def list_tasks(
    puch_user_id: Annotated[str, Field(description="Puch User Unique Identifier")],
    status: Annotated[
        Optional[Literal["open", "completed"]], Field(description="Filter by status")
    ] = None,
    tag: Annotated[Optional[str], Field(description="Filter by tag")] = None,
    search: Annotated[
        Optional[str], Field(description="Substring in title/notes")
    ] = None,
) -> list[TextContent]:
    try:
        tasks = list(_user_tasks(puch_user_id).values())
        if status:
            tasks = [t for t in tasks if t["status"] == status]
        if tag:
            tasks = [t for t in tasks if tag in (t.get("tags") or [])]
        if search:
            q = search.lower()
            tasks = [
                t
                for t in tasks
                if q in t["title"].lower()
                or (t.get("notes") or "").lower().find(q) != -1
            ]
        tasks.sort(
            key=lambda t: (t.get("due_at") or "9999", t["created_at"])
        )  # simple sort
        return [TextContent(type="text", text=json.dumps(tasks))]
    except Exception as e:
        _error(INTERNAL_ERROR, str(e))


@mcp.tool(description=GET_TASK_DESCRIPTION.model_dump_json())
async def get_task(
    puch_user_id: Annotated[str, Field(description="Puch User Unique Identifier")],
    task_id: Annotated[str, Field(description="Task ID")],
) -> list[TextContent]:
    try:
        t = _user_tasks(puch_user_id).get(task_id)
        if not t:
            _error(INVALID_PARAMS, f"No task {task_id} for user")
        return [TextContent(type="text", text=json.dumps(t))]
    except McpError:
        raise
    except Exception as e:
        _error(INTERNAL_ERROR, str(e))


@mcp.tool(description=COMPLETE_TASK_DESCRIPTION.model_dump_json())
async def complete_task(
    puch_user_id: Annotated[str, Field(description="Puch User Unique Identifier")],
    task_id: Annotated[str, Field(description="Task ID")],
) -> list[TextContent]:
    try:
        user_tasks = _user_tasks(puch_user_id)
        t = user_tasks.get(task_id)
        if not t:
            _error(INVALID_PARAMS, f"No task {task_id} for user")
        t["status"] = "completed"
        t["updated_at"] = _now()
        return [TextContent(type="text", text=json.dumps(t))]
    except McpError:
        raise
    except Exception as e:
        _error(INTERNAL_ERROR, str(e))


@mcp.tool(description=REMOVE_TASK_DESCRIPTION.model_dump_json())
async def remove_task(
    puch_user_id: Annotated[str, Field(description="Puch User Unique Identifier")],
    task_id: Annotated[str, Field(description="Task ID")],
) -> list[TextContent]:
    try:
        user_tasks = _user_tasks(puch_user_id)
        if task_id not in user_tasks:
            _error(INVALID_PARAMS, f"No task {task_id} for user")
        del user_tasks[task_id]
        return [TextContent(type="text", text=json.dumps({"removed": task_id}))]
    except McpError:
        raise
    except Exception as e:
        _error(INTERNAL_ERROR, str(e))


# --- Run MCP Server ---
async def main():
    print("🧭 Starting Task MCP server on http://0.0.0.0:8086  (in-memory store)")
    await mcp.run_async("streamable-http", host="0.0.0.0", port=8086)


if __name__ == "__main__":
    asyncio.run(main())
