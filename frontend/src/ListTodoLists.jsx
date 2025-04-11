import { useState } from "react";
import PropTypes from "prop-types";
import "./ListToDoLists.css";
import { FaEdit, FaSave, FaTrash } from "react-icons/fa";

/**
 * @typedef {Object} ListSummary
 * @property {string} id - Unique identifier of the list.
 * @property {string} name - Name of the list.
 */

/**
 * Component for displaying and managing a user's to-do lists.
 * 
 * Features include:
 * - Creating a new list
 * - Editing an existing list's name
 * - Deleting a list
 * - Selecting a list to view its items
 *
 * @param {Object} props - Component props
 * @param {ListSummary[] | null} props.listSummaries - Array of to-do list summaries or null during loading
 * @param {(id: string) => void} props.handleSelectList - Called when a list is selected
 * @param {(name: string) => void} props.handleNewToDoList - Called when a new list is created
 * @param {(id: string) => void} props.handleDeleteToDoList - Called when a list is deleted
 * @param {(id: string, name: string) => void} props.handleUpdateToDoList - Called when a list name is updated
 */
export default function ListToDoLists({
  listSummaries,
  handleSelectList,
  handleNewToDoList,
  handleDeleteToDoList,
  handleUpdateToDoList,
}) {
  // Local state for creating new list
  const [newName, setNewName] = useState("");

  // Track the ID of the list currently being edited
  const [editingId, setEditingId] = useState(null);

  // Edited name input value
  const [editedName, setEditedName] = useState("");

  // Ensure a default empty array when data is not loaded
  const lists = Array.isArray(listSummaries) ? listSummaries : [];

  /**
   * Handle the creation of a new list
   * Prevents empty names and resets the input on submit
   * @param {React.FormEvent} e
   */
  function onSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    handleNewToDoList(newName.trim());
    setNewName("");
  }

  /**
   * Saves the updated name of a list
   * @param {string} id - ID of the list being updated
   */
  function handleSaveUpdate(id) {
    if (!editedName.trim()) return;
    handleUpdateToDoList(id, editedName.trim());
    setEditingId(null);
    setEditedName("");
  }

  return (
    <div className="ListTodoLists">
      <h1>Your To‑Do Lists</h1>

      {/* Form to create a new list */}
      <form onSubmit={onSubmit} className="create-list-container">
        <div className="input-group">
          <input
            type="text"
            placeholder="New list name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">Create</button>
        </div>
      </form>

      {/* Display loading spinner or appropriate message */}
      {listSummaries == null ? (
        <div className="loading-spinner"></div>
      ) : lists.length === 0 ? (
        <p>No lists yet.</p>
      ) : (
        <ul className="list-summaries">
          {/* Render each to-do list */}
          {lists.map((list) => (
            <li key={list.id} className="list-summary">
              <div
                className="list-info"
                onClick={() => handleSelectList(list.id)}
              >
                {/* If editing, show input; otherwise show list name */}
                {editingId === list.id ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="edit-input"
                    onClick={(e) => e.stopPropagation()} // Prevent select on click
                  />
                ) : (
                  <span>{list.name}</span>
                )}
                <span className="item-count">Click to view items</span>
              </div>

              {/* Save button (if editing) */}
              {editingId === list.id ? (
                <button
                  className="save-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveUpdate(list.id);
                  }}
                  aria-label={`Save ${list.name}`}
                >
                  <FaSave />
                </button>
              ) : (
                // Edit button
                <button
                  className="edit-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(list.id);
                    setEditedName(list.name);
                  }}
                  aria-label={`Edit ${list.name}`}
                >
                  <FaEdit />
                </button>
              )}

              {/* Delete button */}
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteToDoList(list.id);
                }}
                aria-label={`Delete ${list.name}`}
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Prop type validation
ListToDoLists.propTypes = {
  listSummaries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  handleSelectList: PropTypes.func.isRequired,
  handleNewToDoList: PropTypes.func.isRequired,
  handleDeleteToDoList: PropTypes.func.isRequired,
  handleUpdateToDoList: PropTypes.func.isRequired,
};

// Default props when listSummaries is not yet loaded
ListToDoLists.defaultProps = {
  listSummaries: null,
};
