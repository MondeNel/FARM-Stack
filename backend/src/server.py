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
app = FastAPI(lifespan=lifespan)  # Create a FastAPI application instance with custom lifespan handler
