import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import ListToDoLists from "./ListTodoLists";
import ToDoList from "./TodoList";

/**
 * @typedef {import("./ListTodoLists").ListSummary} ListSummary
 */

/**
 * Root component of the to-do list application.
 * 
 * Handles:
 * - Fetching and storing list summaries
 * - Creating, deleting, and updating lists
 * - Switching between list view and item view
 */
function App() {
  const [listSummaries, setListSummaries] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);

  /**
   * On component mount:
   * - Attempt to load data from localStorage
   * - Then fetch latest data from backend
   */
  useEffect(() => {
    const stored = window.localStorage.getItem("todo-lists");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setListSummaries(parsed);
        }
      } catch {
        // Ignore if JSON parsing fails
      }
    }

    reloadData().catch(console.error);
  }, []);

  /**
   * Fetch all list summaries from backend and sync with localStorage.
   */
  async function reloadData() {
    try {
      const { data } = await axios.get("/api/lists");
      setListSummaries(data);
      window.localStorage.setItem("todo-lists", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  }

  /**
   * Create a new to-do list.
   * 
   * @param {string} name - Name of the new list
   */
  function handleNewToDoList(name) {
    axios
      .post("/api/lists", { name })
      .then(reloadData)
      .catch(console.error);
  }

  /**
   * Delete an existing to-do list.
   * 
   * @param {string} id - ID of the list to delete
   */
  function handleDeleteToDoList(id) {
    axios
      .delete(`/api/lists/${id}`)
      .then(() => {
        if (selectedListId === id) {
          setSelectedListId(null);
        }
        reloadData();
      })
      .catch(console.error);
  }

  /**
   * Update the name of an existing to-do list.
   * 
   * @param {string} id - ID of the list
   * @param {string} name - New name to update
   */
  function handleUpdateToDoList(id, name) {
    axios
      .put(`/api/lists/${id}`, { name })
      .then(reloadData)
      .catch(console.error);
  }

  /**
   * Set a list as the currently selected list for item view.
   * 
   * @param {string} id - ID of the list to view
   */
  function handleSelectList(id) {
    setSelectedListId(id);
  }

  /**
   * Go back to the list summaries view.
   */
  function backToListView() {
    setSelectedListId(null);
    reloadData().catch(console.error);
  }

  return (
    <div className="App">
      {/* Conditional rendering between list view and selected list's item view */}
      {selectedListId === null ? (
        <ListToDoLists
          listSummaries={listSummaries}
          handleSelectList={handleSelectList}
          handleNewToDoList={handleNewToDoList}
          handleDeleteToDoList={handleDeleteToDoList}
          handleUpdateToDoList={handleUpdateToDoList}
        />
      ) : (
        <ToDoList
          listId={selectedListId}
          handleBackButton={backToListView}
        />
      )}
    </div>
  );
}

export default App;
