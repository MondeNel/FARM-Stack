from contextlib import asynccontextmanager
from datetime import datetime
import os
import sys
from bson import ObjectId
from fastapi import FastAPI, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import uvicorn
from dal import ToDoAll, ListSummary, TodoList

# Configuration settings
COLLECTION_NAME = "todo_list"
MONGO_URL = os.getenv("MONGO_URL")
DEBUG = os.getenv("DEBUG", "False").lower() in {"1", "true", "on", "yes"}



# Helper function to validate ObjectId format
def is_valid_object_id(id: str) -> bool:
    """Check if the string is a valid ObjectId format."""
    try:
        ObjectId(id)
        return True
    except Exception:
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup:
    client = AsyncIOMotorClient(MONGO_URL)
    database = client.get_default_database()

    # Ensure the database is available:
    pong = await database.command("ping")
    if pong.get("ok") != 1:
        raise Exception("Cluster connection is not available")

    todo_lists = database.get_collection(COLLECTION_NAME)
    app.todo_dal = ToDoAll(todo_lists)

    # Yield back to FastAPI Application:
    yield

    # Shutdown:
    await client.close()


app = FastAPI(lifespan=lifespan, debug=DEBUG)

# Add CORS middleware to allow the frontend to make requests to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Replace with the URL of your frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# Request and Response Models for New List
class NewList(BaseModel):
    name: str


class NewListResponse(BaseModel):
    id: str
    name: str


# Endpoint to get all To-Do Lists
@app.get("/api/lists")
async def get_all_lists() -> list[ListSummary]:
    return [i async for i in app.todo_dal.get_all_lists()]


# Endpoint to create a new To-Do list
@app.post("/api/lists", status_code=status.HTTP_201_CREATED)
async def create_todo_list(new_list: NewList) -> NewListResponse:
    list_id = await app.todo_dal.create_todo_list(new_list.name)
    return NewListResponse(id=str(list_id), name=new_list.name)


# Endpoint to delete a specific To-Do list
@app.delete("/api/lists/{list_id}")
async def delete_list(list_id: str) -> bool:
    if not is_valid_object_id(list_id):
        raise HTTPException(status_code=400, detail="Invalid list ID format")
    
    await app.todo_dal.delete_list(ObjectId(list_id))
    return True


# Endpoint to retrieve a specific To-Do list
@app.get("/api/lists/{list_id}")
async def get_list(list_id: str) -> TodoList:
    if not is_valid_object_id(list_id):
        raise HTTPException(status_code=400, detail="Invalid list ID format")
    
    todo_list = await app.todo_dal.get_list(ObjectId(list_id))
    if not todo_list:
        raise HTTPException(status_code=404, detail="To-Do list not found")
    return todo_list


# Endpoint to create a new To-Do item
class NewItem(BaseModel):
    label: str


class NewItemResponse(BaseModel):
    id: str
    label: str


@app.post("/api/lists/{list_id}/items", status_code=status.HTTP_201_CREATED)
async def create_todo_item(list_id: str, new_item: NewItem) -> NewItemResponse:
    if not is_valid_object_id(list_id):
        raise HTTPException(status_code=400, detail="Invalid list ID format")

    item_id = await app.todo_dal.create_item(ObjectId(list_id), new_item.label)
    return NewItemResponse(id=str(item_id), label=new_item.label)


# Endpoint to delete a specific To-Do item
@app.delete("/api/lists/{list_id}/items/{item_id}")
async def delete_item(list_id: str, item_id: str) -> TodoList:
    if not is_valid_object_id(list_id) or not is_valid_object_id(item_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    return await app.todo_dal.delete_item(ObjectId(list_id), ObjectId(item_id))


# Endpoint to update a To-Do item (checked state)
class TodoItemUpdate(BaseModel):
    label: str
    checked_state: bool


@app.patch("/api/lists/{list_id}/items/{item_id}")
async def set_checked_state(list_id: str, item_id: str, item_update: TodoItemUpdate) -> TodoList:
    if not is_valid_object_id(list_id) or not is_valid_object_id(item_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    return await app.todo_dal.set_checked_state(ObjectId(list_id), ObjectId(item_id), item_update.checked_state)


# Main function for running the FastAPI server
def main(argv=sys.argv[1:]):
    try:
        uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=DEBUG)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
