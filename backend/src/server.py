from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List
from uuid import uuid4

app = FastAPI()

# ─── Models ───────────────────────────────────────────────────────────────────

class ListSummary(BaseModel):
    id: str
    name: str

class ToDoItem(BaseModel):
    id: str
    label: str
    checked: bool = False

class ToDoList(BaseModel):
    id: str
    name: str
    items: List[ToDoItem] = []

class NewList(BaseModel):
    name: str

class NewItem(BaseModel):
    label: str

class ToDoItemUpdate(BaseModel):
    item_id: str
    checked_state: bool

# ─── In‑Memory Store ───────────────────────────────────────────────────────────

# Structure: { list_id: { "name": str, "items": { item_id: ToDoItem } } }
_store: Dict[str, Dict] = {}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_list_or_404(list_id: str) -> Dict:
    if list_id not in _store:
        raise HTTPException(status_code=404, detail="List not found")
    return _store[list_id]

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/lists", response_model=List[ListSummary])
async def get_all_lists():
    """
    Get all to‑do lists.
    """
    return [
        ListSummary(id=list_id, name=data["name"])
        for list_id, data in _store.items()
    ]

@app.post("/api/lists", status_code=status.HTTP_201_CREATED, response_model=ListSummary)
async def create_todo_list(new_list: NewList):
    """
    Create a new to‑do list.
    """
    list_id = str(uuid4())
    _store[list_id] = {"name": new_list.name, "items": {}}
    return ListSummary(id=list_id, name=new_list.name)

@app.get("/api/lists/{list_id}", response_model=ToDoList)
async def get_list(list_id: str):
    """
    Get a single to‑do list by ID.
    """
    data = _get_list_or_404(list_id)
    items = list(data["items"].values())
    return ToDoList(id=list_id, name=data["name"], items=items)

@app.delete("/api/lists/{list_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(list_id: str):
    """
    Delete a to‑do list by ID.
    """
    _get_list_or_404(list_id)
    del _store[list_id]

@app.post("/api/lists/{list_id}/items", status_code=status.HTTP_201_CREATED, response_model=ToDoItem)
async def create_item(list_id: str, new_item: NewItem):
    """
    Create a new item in a to‑do list.
    """
    data = _get_list_or_404(list_id)
    item_id = str(uuid4())
    item = ToDoItem(id=item_id, label=new_item.label)
    data["items"][item_id] = item
    return item

@app.delete("/api/lists/{list_id}/items/{item_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(list_id: str, item_id: str):
    """
    Delete an item from a to‑do list.
    """
    data = _get_list_or_404(list_id)
    if item_id not in data["items"]:
        raise HTTPException(status_code=404, detail="Item not found")
    del data["items"][item_id]

@app.patch("/api/lists/{list_id}/checked_state", response_model=ToDoItem)
async def set_checked_state(list_id: str, update: ToDoItemUpdate):
    """
    Update the checked state of an item.
    """
    data = _get_list_or_404(list_id)
    if update.item_id not in data["items"]:
        raise HTTPException(status_code=404, detail="Item not found")
    item = data["items"][update.item_id]
    item.checked = update.checked_state
    return item

# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=True)
