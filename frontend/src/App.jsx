import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import ListToDoLists from "./ListTodoLists";
import ToDoList from "./TodoList";


/**
 * @typedef {import("./ListTodoLists").ListSummary} ListSummary
 */

/**
 * Main application component.
 */
function App() {
  /** @type {[ListSummary[], Function]} */
  const [listSummaries, setListSummaries] = useState([]);  // ← start as empty array
  const [selectedListId, setSelectedListId] = useState(null);

  // Load summaries from LocalStorage or API on mount
  useEffect(() => {
    const stored = window.localStorage.getItem("todo-lists");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setListSummaries(parsed);
        }
      } catch {
        // ignore invalid JSON
      }
    }
    reloadData().catch(console.error);
  }, []);

  /** Fetch latest from backend and sync to LocalStorage */
  async function reloadData() {
    const { data } = await axios.get("/api/lists");
    setListSummaries(data);
    window.localStorage.setItem("todo-lists", JSON.stringify(data));
  }

  /**
   * Create a new to‑do list.
   * @param {string} name
   */
  function handleNewToDoList(name) {
    axios
      .post("/api/lists", { name })
      .then(() => reloadData())
      .catch(console.error);
  }

  /**
   * Delete a to‑do list.
   * @param {string} id
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
   * Select a list to view items.
   * @param {string} id
   */
  function handleSelectList(id) {
    setSelectedListId(id);
  }

  /** Go back to list-of-lists view */
  function backToListView() {
    setSelectedListId(null);
    reloadData().catch(console.error);
  }

  return (
    <div className="App">
      {selectedListId === null ? (
        <ListToDoLists
          listSummaries={listSummaries}
          handleSelectList={handleSelectList}
          handleNewToDoList={handleNewToDoList}
          handleDeleteToDoList={handleDeleteToDoList}
        />
      ) : (
        <ToDoList listId={selectedListId} handleBackButton={backToListView} />
      )}
    </div>
  );
}

export default App;
