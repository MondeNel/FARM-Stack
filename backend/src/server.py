# Server file

# Import necessary modules and libraries
from contextlib import asynccontextmanager  # Provides a context manager for asynchronous operations
from datetime import datetime  # Used for handling date and time objects
import os  # Provides a way of interacting with the operating system
import sys  # Provides access to some variables used or maintained by the interpreter

from bson import ObjectId  # Used for handling MongoDB ObjectIds
from fastapi import FastAPI, status  # FastAPI framework for defining web APIs and HTTP status codes
from motor.motor_asyncio import AsyncIOMotorClient  # Motor is an asynchronous driver for MongoDB
from pydantic import BaseModel  # Pydantic for data validation and serialization
import uvicorn  # ASGI server for running the FastAPI application

# Import database access layer (DAL) modules for interaction with MongoDB
from dal import ToDoAll, ListSummary, TodoList  # Custom DAL functions and models to interact with MongoDB

# ==============================
# Configuration settings
# ==============================
COLLECTION_NAME = "todo_list"  # MongoDB collection name for To-Do lists
MONGO_URL = os.getenv("MONGO_URL")  # Get MongoDB connection URL from the environment variable
DEBUG = os.getenv("DEBUG", "False").lower() in {"1", "true", "on", "yes"}  # Set the debug mode based on the environment variable

# ==============================
# Lifespan context manager for handling MongoDB connection
# ==============================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    This async context manager handles the lifespan of the FastAPI application. 
    It connects to the MongoDB database at startup and closes the connection at shutdown.

    :param app: FastAPI instance representing the application.
    """
    # Connect to MongoDB on application startup
    client = AsyncIOMotorClient(MONGO_URL)  # Connect to MongoDB asynchronously
    database = client.get_default_database()  # Get the default database

    # Ensure the database is available by sending a ping command
    pong = await database.command("ping")
    if pong.get("ok") != 1:
        raise Exception("Cluster connection is not available")  # Raise an error if MongoDB is unreachable
    
    # Get the To-Do lists collection
    todo_lists = database.get_collection[COLLECTION_NAME]
    # Initialize the Data Access Layer (DAL) with the MongoDB collection
    app.todo_dal = ToDoAll(todo_lists)

    # Yield the app to allow FastAPI to run while maintaining MongoDB connection
    try:
        yield
    finally:
        # Cleanup: Close the MongoDB connection on shutdown
        client.close()

# ==============================
# FastAPI Application
# ==============================
app = FastAPI(lifespan=lifespan, debug=DEBUG)  # Create a FastAPI application instance with custom lifespan handler



# ==============================
# Endpoint: Get all To-Do Lists
# ==============================

@app.get("/api/lists")
async def get_all_lists() -> list[ListSummary]:
    """
    Retrieves all the To-Do lists from the database.

    This endpoint fetches all available To-Do lists and returns them as a list of `ListSummary` objects. 
    Each `ListSummary` contains the ID, name, and item count of the To-Do list.

    :return: A list of `ListSummary` objects representing all To-Do lists.
    """
    return [i async for i in app.todo_dal.get_all_lists()]

# ==============================
# Request and Response Models for New List
# ==============================

class NewList(BaseModel):
    """
    Model for the request body when creating a new To-Do list.

    This model expects the name of the new To-Do list to be provided as input.
    """
    name: str

class NewListResponse(BaseModel):
    """
    Model for the response returned after creating a new To-Do list.

    This model contains the ID and name of the newly created To-Do list.
    """
    id: str
    name: str

# ==============================
# Endpoint: Create a New To-Do List
# ==============================

@app.post("/api/lists", status_code=status.HTTP_201_CREATED)
async def create_todo_list(new_list: NewList) -> NewListResponse:
    """
    Creates a new To-Do list in the database.

    This endpoint accepts the name of a new To-Do list, creates the list in the database, 
    and returns the newly created list's ID and name.

    :param new_list: The request body containing the name of the new To-Do list.
    :return: A `NewListResponse` object containing the ID and name of the created To-Do list.
    """
    return NewListResponse(
        id=await app.todo_dal.create_list(new_list.name),  # Create the list in the database and get the ID
        name=new_list.name  # Return the name of the new list
    )

# ==============================
# Endpoint: Get Specific To-Do List
# ==============================

@app.get("/api/lists/{list_id}")
async def get_list(list_id: str) -> TodoList:
    """
    Retrieves a specific To-Do list from the database by its ID.

    This endpoint fetches a To-Do list by its ID and returns the list with all its items.
    The list will include its name, ID, and associated To-Do items.

    :param list_id: The ID of the To-Do list to retrieve.
    :return: A `TodoList` object representing the requested To-Do list with all its items.
    """
    return await app.todo_dal.get_list(ObjectId(list_id))  # Retrieve the list by its ID from the database

# ==============================
# Endpoint: Delete Specific To-Do List
# ==============================

@app.delete("/api/lists/{list_id}")
async def delete_list(list_id: str) -> bool:
    """
    Deletes a specific To-Do list from the database.

    This endpoint deletes a To-Do list by its ID. If the list is successfully deleted, it returns `True`.
    
    :param list_id: The ID of the To-Do list to delete.
    :return: `True` if the list is successfully deleted, otherwise `False`.
    """
    await app.todo_dal.delete_list(ObjectId(list_id))  # Delete the list by its ID from the database
    return True  # Assuming the list is always deleted successfully


# ==============================
# Model for New To-Do Item Request Body
# ==============================

class NewItem(BaseModel):
    """
    Model for the request body when creating a new To-Do item.

    This model expects the name of the new To-Do item to be provided as input.
    """
    label: str  # The label (name) of the new To-Do item

# ==============================
# Model for New To-Do Item Response
# ==============================

class NewItemResponse(BaseModel):
    """
    Model for the response returned after creating a new To-Do item.

    This model contains the ID and label of the newly created To-Do item.
    """
    id: str  # The ID of the newly created To-Do item
    label: str  # The label (name) of the newly created To-Do item

# ==============================
# Endpoint: Create New To-Do Item
# ==============================

@app.post("/api/lists/{list_id}/items", status_code=status.HTTP_201_CREATED)
async def create_todo_item(list_id: str, new_item: NewItem) -> NewItemResponse:
    """
    Creates a new To-Do item in the specified list.

    This endpoint accepts the ID of a To-Do list and the name of a new To-Do item,
    creates the item in the specified list, and returns the newly created item's ID and name.

    :param list_id: The ID of the To-Do list to which the item belongs.
    :param new_item: The request body containing the name of the new To-Do item.
    :return: A `NewItemResponse` object containing the ID and name of the created To-Do item.
    """
    # Create the item in the specified list and return the response with the new item's ID and label
    return NewItemResponse(
        id=await app.todo_dal.create_item(ObjectId(list_id), new_item.label),  # Create the item in the list
        label=new_item.label  # Return the label of the newly created item
    )

# ==============================
# Endpoint: Delete Specific To-Do Item
# ==============================

@app.delete("/api/lists/{list_id}/items/{item_id}")
async def delete_item(list_id: str, item_id: str) -> TodoList:
    """
    Deletes a specific To-Do item from a To-Do list.

    This endpoint deletes a To-Do item by its ID from a specified To-Do list.

    :param list_id: The ID of the To-Do list containing the item.
    :param item_id: The ID of the To-Do item to delete.
    :return: The updated To-Do list after the item is deleted.
    """
    # Delete the item from the specified To-Do list
    return await app.todo_dal.delete_item(ObjectId(list_id), ObjectId(item_id))

# ==============================
# Model for To-Do Item Update Request Body
# ==============================

class TodoItemUpdate(BaseModel):
    """
    Model for the request body when updating a To-Do item.

    This model expects the new label for the To-Do item and the updated checked state to be provided as input.
    """
    label: str  # The new label (name) for the To-Do item
    checked_state: bool  # The new checked state (True or False) for the To-Do item

# ==============================
# Endpoint: Set Checked State for To-Do Item
# ==============================

@app.patch("/api/lists/{list_id}/checked_state")
async def set_checked_state(list_id: str, item_id: str, item_update: TodoItemUpdate) -> TodoList:
    """
    Updates the checked state of a specific To-Do item in a To-Do list.

    This endpoint updates the label and checked state of a specific To-Do item in a To-Do list.

    :param list_id: The ID of the To-Do list containing the item to update.
    :param item_id: The ID of the To-Do item to update.
    :param item_update: The request body containing the new label and checked state.
    :return: The updated `TodoList` object after modifying the item.
    """
    # Update the checked state and label of the To-Do item in the specified list
    return await app.todo_dal.set_checked_state(ObjectId(list_id), ObjectId(item_id), item_update.label, item_update.checked_state)



# ==============================
# Model for Dummy Response (Testing)
# ==============================

class DummyResponse(BaseModel):
    """
    Model for the dummy response returned by the /api/dummy endpoint.

    This model contains a dummy ID and the current date and time for testing purposes.
    """
    id: str  # The dummy ID (ObjectId as string)
    when: datetime  # The current date and time of the request

# ==============================
# Endpoint: Dummy API for Testing
# ==============================

@app.get("/api/dummy")
async def get_dummy() -> DummyResponse:
    """
    Retrieves a dummy response for testing purposes.

    This endpoint returns a dummy response for testing the API.

    :return: A `DummyResponse` object containing a dummy message with a generated ID and the current time.
    """
    # Generate a dummy response containing a random ObjectId and the current timestamp
    return DummyResponse(
        id=str(ObjectId()),  # Generate a dummy ID (ObjectId converted to string)
        when=datetime.now(),  # Get the current date and time
    )

# ==============================
# Main Function for Running the Server
# ==============================

def main(argv=sys.argv[1:]):
    """
    Main function to run the FastAPI server using Uvicorn.

    This function starts the Uvicorn ASGI server to run the FastAPI application,
    with the option to enable reloading if the DEBUG mode is set to True.
    
    :param argv: Command-line arguments passed to the script.
    """
    try:
        # Run the FastAPI application with Uvicorn on the specified host and port
        uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=DEBUG)
    except KeyboardInterrupt:
        # Gracefully handle server shutdown when interrupted
        pass

# ==============================
# Check for Direct Script Execution
# ==============================

if __name__ == "__main__":
    main()  # Run the main function if the script is executed directly

