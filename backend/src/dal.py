# Data access layer for handling database operations using MongoDB (FARM Stack)

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pydantic import BaseModel  # Corrected import
from uuid import uuid4

# ================================
# Data Models
# ================================

class ListSummary(BaseModel):
    """
    Represents a summary of a To-Do List.
    Includes list ID, name, and item count.
    """
    id: str
    name: str
    item_count: int

    @staticmethod
    def from_doc(doc) -> "ListSummary":
        """
        Converts a MongoDB document into a ListSummary object.
        
        :param doc: MongoDB document containing list details.
        :return: ListSummary object.
        """
        return ListSummary(
            id=str(doc["_id"]),  
            name=doc["name"],
            item_count=doc["item_count"]
        )

class TodoListItem(BaseModel):  
    """
    Represents a single To-Do list item.
    Each item has an ID, label (task name), and a boolean checked state.
    """
    id: str
    label: str
    checked: bool

    @staticmethod
    def from_doc(doc) -> "TodoListItem":
        """
        Converts a MongoDB document into a TodoListItem object.
        
        :param doc: MongoDB document containing item details.
        :return: TodoListItem object.
        """
        return TodoListItem(  
            id=str(doc["_id"]),  
            label=doc["label"],
            checked=doc["checked"]
        )

class TodoList(BaseModel):
    """
    Represents a To-Do list.
    Contains a list ID, name, and a collection of To-Do items.
    """
    id: str
    name: str
    items: list[TodoListItem]  # Fixed incorrect reference

    @staticmethod
    def from_doc(doc) -> "TodoList":
        """
        Converts a MongoDB document into a TodoList object.
        
        :param doc: MongoDB document containing to-do list details.
        :return: TodoList object.
        """
        return TodoList(  
            id=str(doc["_id"]),  
            name=doc["name"],
            items=[TodoListItem.from_doc(item) for item in doc["items"]]
        )

# ================================
# Database Operations
# ================================

class ToDoAll:
    """
    Handles all CRUD operations for the To-Do List collection.
    """

    def __init__(self, todo_collection: AsyncIOMotorClient):
        """
        Initializes the database operations handler.

        :param todo_collection: MongoDB collection for To-Do lists.
        """
        self.todo_collection = todo_collection

    async def list_todo_lists(self, session=None):
        """
        Retrieves a list of To-Do lists with their name and item count.

        :param session: MongoDB session for transaction handling (optional).
        :yield: ListSummary objects for each To-Do list in the database.
        """
        async for doc in self.todo_collection.find(
            {},  # Retrieve all documents
            projection={  # Corrected spelling (was "projecttion")
                "name": 1,
                "item_count": {"$size": "$items"},  # Calculate item count dynamically
            },
            sort={"name": 1},  # Sort lists alphabetically by name
            session=session,
        ):
            yield ListSummary.from_doc(doc)

    async def create_todo_list(self, name: str, session=None):
        """
        Creates a new To-Do list with the given name.

        :param name: Name of the new To-Do list.
        :param session: MongoDB session for transaction handling (optional).
        :return: The inserted document ID.
        """
        response = await self.todo_collection.insert_one(
            {"name": name, "items": []},  # Initialize an empty list
            session=session,
        )
        return str(response.inserted_id)  # Return the inserted list's ID
    
    async def get_todo_list(self, id: str, session=None):
        """
        Retrieves a To-Do list by its ID.
        
        """
        doc = await self.todo_collection.find_one(
            {"_id": ObjectId(id)},
            session=session,
        )
        return TodoList.from_doc(doc)
    
    async def delete_todo_list(self, id: str | ObjectId, session=None):
        """
        Deletes a To-Do list by its ID.
        
        """
        response = await self.todo_collection.delete_one(
            {"_id": ObjectId(id)},
            session=session,
        )

        return response.deleted_count == 1
    
    async def create_item(
            self,
            id: str | ObjectId,
            label: str,
            session=None,
    ) -> TodoList | None:
        """
        Creates a new item in a To-Do list.
        
        """
        response = await self.todo_collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$push": {"items": {"_id": uuid4().hex, "label": label, "checked": False}}},
            session=session,
            return_document=ReturnDocument.AFTER,
        )
        return TodoList.from_doc(response) if response else None
    
    async def set_checked_state(
            self,
            list_id: str | ObjectId,
            item_id: str,
            checked_state: bool,
            session=None,
    ) -> TodoList | None:
        """
        Updates the checked state of a To-Do list item.
        
        """
        result = await self.todo_collection.find_one_and_update(
            {"_id": ObjectId(list_id), "items._id": item_id},
            {"$set": {"items.$.checked": checked_state}},
            session=session,
            return_document=ReturnDocument.AFTER,
        )
        return TodoList.from_doc(result) if result else None
    

    async def delete_item(
            self,
            list_id: str | ObjectId,
            item_id: str,
            session=None,
    ) -> TodoList | None:
        """
        Deletes an item from a To-Do list.
        
        """
        result = await self.todo_collection.find_one_and_update(
            {"_id": ObjectId(list_id)},
            {"$pull": {"items": {"_id": item_id}}},
            session=session,
            return_document=ReturnDocument.AFTER,
        )
        return TodoList.from_doc(result) if result else None
    
