from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Optional
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import pytz

# Initialize FastAPI app
app = FastAPI()

# Middleware setup for handling Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://frontend:5173"],  # Allow frontend URLs
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ─── Models ───────────────────────────────────────────────────────────────────

# Model representing a summary of a to-do list (includes id and name)
class ListSummary(BaseModel):
    id: str
    name: str
    createdAt: str
    updatedAt: str

# Model for representing a to-do item (with id, label, checked state, createdAt, updatedAt)
class ToDoItem(BaseModel):
    id: str
    label: str
    checked: bool = False
    createdAt: str
    updatedAt: str

# Model for representing a full to-do list (with id, name, list of items)
class ToDoList(BaseModel):
    id: str
    name: str
    createdAt: str
    updatedAt: str
    items: List[ToDoItem] = []

# Model for creating a new to-do list (only requires name)
class NewList(BaseModel):
    name: str

# Model for updating the name of an existing to-do list
class UpdateListName(BaseModel):
    name: str

# Model for creating a new to-do item (only requires label)
class NewItem(BaseModel):
    label: str

# Model for updating a to-do item (can update checked state or label)
class ToDoItemUpdate(BaseModel):
    item_id: str
    checked_state: Optional[bool] = None
    label: Optional[str] = None

# ─── In‑Memory Store ───────────────────────────────────────────────────────────

# A dictionary to simulate a simple in-memory data store.
_store: Dict[str, Dict] = {}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_current_time():
    """Helper function to get the current time with timezone info (UTC)."""
    return datetime.now(pytz.utc).isoformat()

def _get_list_or_404(list_id: str) -> Dict:
    """
    Helper function to retrieve a to-do list by its ID. 
    Raises a 404 error if the list is not found.
    
    @param list_id: ID of the to-do list to fetch
    @return: The to-do list data (dict) associated with the list_id
    """
    if list_id not in _store:
        raise HTTPException(status_code=404, detail="List not found")
    return _store[list_id]

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/lists", response_model=List[ListSummary])
async def get_all_lists():
    """
    Fetch all the to-do list summaries (id and name).
    
    @return: A list of to-do list summaries
    """
    return [
        ListSummary(
            id=list_id,
            name=data["name"],
            createdAt=data["createdAt"],
            updatedAt=data["updatedAt"]
        )
        for list_id, data in _store.items()
    ]

@app.post("/api/lists", status_code=status.HTTP_201_CREATED, response_model=ListSummary)
async def create_todo_list(new_list: NewList):
    """
    Create a new to-do list.
    
    @param new_list: Data for the new to-do list (name)
    @return: The newly created to-do list summary (id and name)
    """
    list_id = str(uuid4())  # Generate a new unique ID for the list
    created_at = updated_at = get_current_time()  # Set current timestamp
    _store[list_id] = {"name": new_list.name, "items": {}, "createdAt": created_at, "updatedAt": updated_at}  # Add to store
    return ListSummary(id=list_id, name=new_list.name, createdAt=created_at, updatedAt=updated_at)

@app.get("/api/lists/{list_id}", response_model=ToDoList)
async def get_list(list_id: str):
    """
    Fetch a full to-do list (id, name, items, timestamps) by its ID.
    
    @param list_id: ID of the list to fetch
    @return: The full to-do list details
    """
    data = _get_list_or_404(list_id)
    items = [
        ToDoItem(
            id=item_id,
            label=item["label"],
            checked=item["checked"],
            createdAt=item["createdAt"],
            updatedAt=item["updatedAt"]
        ) for item_id, item in data["items"].items()
    ]
    return ToDoList(
        id=list_id,
        name=data["name"],
        createdAt=data["createdAt"],
        updatedAt=data["updatedAt"],
        items=items
    )

@app.put("/api/lists/{list_id}", response_model=ListSummary)
async def update_list_name(list_id: str, update: UpdateListName):
    """
    Update the name of an existing to-do list.
    
    @param list_id: ID of the list to update
    @param update: The new name for the list
    @return: The updated list summary (id and new name)
    """
    data = _get_list_or_404(list_id)
    data["name"] = update.name  # Update the name
    data["updatedAt"] = get_current_time()  # Update the updatedAt timestamp
    return ListSummary(id=list_id, name=update.name, createdAt=data["createdAt"], updatedAt=data["updatedAt"])

@app.delete("/api/lists/{list_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(list_id: str):
    """
    Delete an existing to-do list by its ID.
    
    @param list_id: ID of the list to delete
    @return: No content response on success
    """
    _get_list_or_404(list_id)  # Check if the list exists
    del _store[list_id]  # Remove the list from the store

@app.post("/api/lists/{list_id}/items", status_code=status.HTTP_201_CREATED, response_model=ToDoItem)
async def create_item(list_id: str, new_item: NewItem):
    """
    Add a new item to a specific to-do list.
    
    @param list_id: ID of the list to add the item to
    @param new_item: The item to add (label)
    @return: The newly created to-do item (id, label, checked state)
    """
    data = _get_list_or_404(list_id)
    item_id = str(uuid4())  # Generate a new unique ID for the item
    created_at = updated_at = get_current_time()  # Set current timestamp
    item = {
        "id": item_id,
        "label": new_item.label,
        "checked": False,
        "createdAt": created_at,
        "updatedAt": updated_at
    }
    data["items"][item_id] = item  # Add the item to the list
    return ToDoItem(**item)

@app.delete("/api/lists/{list_id}/items/{item_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(list_id: str, item_id: str):
    """
    Delete a specific item from a to-do list.
    
    @param list_id: ID of the list containing the item
    @param item_id: ID of the item to delete
    @return: No content response on success
    """
    data = _get_list_or_404(list_id)
    if item_id not in data["items"]:
        raise HTTPException(status_code=404, detail="Item not found")
    del data["items"][item_id]  # Remove the item

@app.patch("/api/lists/{list_id}/items/{item_id}", response_model=ToDoItem)
async def update_todo_item(list_id: str, item_id: str, update: ToDoItemUpdate):
    """
    Update an existing to-do item in a specific list.
    
    @param list_id: ID of the list containing the item
    @param item_id: ID of the item to update
    @param update: The updated item data (can be label or checked state)
    @return: The updated to-do item
    """
    data = _get_list_or_404(list_id)

    if item_id not in data["items"]:
        raise HTTPException(status_code=404, detail="Item not found")

    item = data["items"][item_id]

    # Apply updates to the item
    if update.checked_state is not None:
        item["checked"] = update.checked_state

    if update.label is not None:
        item["label"] = update.label

    item["updatedAt"] = get_current_time()  # Update the updatedAt timestamp
    return ToDoItem(**item)

# ─── Run the FastAPI application ───────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=True)
