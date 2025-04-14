# 📝 FARM Stack Todo App (FastAPI + React + LocalStorage)

This is a simple **full-stack Todo List application** built with the FARM stack:
- 🐍 **FastAPI** for the backend API
- ⚛️ **React** for the frontend
- 🗃️ **LocalStorage** for persisting data (instead of a database like MongoDB)

Users can:
- Create and delete todo lists
- Add, update, and delete items inside lists
- Each list and item is timestamped with `createdAt` and `updatedAt`

---

## 📁 Project Structure

```bash
project-root/
│
├── backend/           # FastAPI backend
│   └── server.py      # Main API server
│
├── frontend/          # React frontend
│   └── src/           # React source code
│
└── README.md          # Project layout
```
 🚀 How to Run the Application
- 🔧 Prerequisites
Python 3.9+ and pip

▶️ Backend Setup (FastAPI)
- 1. Navigate to the backend directory:
```
cd backend
```

- 2. (Optional) Create a virtual environment:
```
python -m venv venv

source venv/bin/activate  

venv\Scripts\ #On Windows
```

- 3. Install dependencies:

```
pip install fastapi uvicorn pydantic pytz
```

4. Run the FastAPI server:
```
python/src/server.py
```



💻 Frontend Setup (React)

1. Navigate to the frontend directory:
```
cd frontend
```

2. cd frontend
```
npm install
```

3. Start the development server:
```
npm run dev
```

🔗 API Endpoints Overview
Method	Endpoint	Description

- GET	/api/lists	Get all todo list summaries

- POST	/api/lists	Create a new list

- GET	/api/lists/{list_id}	Get a specific list by ID

- PUT	/api/lists/{list_id}	Rename a list

- DELETE	/api/lists/{list_id}	Delete a list

- POST	/api/lists/{list_id}/items	Add item to list

- PATCH	/api/lists/{list_id}/items/{item_id}	Update item (label/checked)

- DELETE	/api/lists/{list_id}/items/{item_id}	Delete item


----------
🧠 Features
Add and manage multiple todo lists

Timestamp tracking (createdAt / updatedAt)

Simple local in-memory storage on the backend

Frontend uses localStorage for quick development


