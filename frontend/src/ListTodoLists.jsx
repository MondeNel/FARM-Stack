import { useState } from "react";
import PropTypes from "prop-types";
import './ListToDoLists.css';

/**
 * @typedef {Object} ListSummary
 * @property {string} id
 * @property {string} name
 */

/**
 * Displays all to‑do lists, allows creation and deletion, and updating the list name.
 *
 * @param {{ 
 *   listSummaries: ListSummary[] | null,
 *   handleSelectList: (id: string) => void,
 *   handleNewToDoList: (name: string) => void,
 *   handleDeleteToDoList: (id: string) => void,
 *   handleUpdateToDoList: (id: string, newName: string) => void,  // Handle update
 * }} props
 */
export default function ListToDoLists({
  listSummaries,
  handleSelectList,
  handleNewToDoList,
  handleDeleteToDoList,
  handleUpdateToDoList,  // New prop for updating a list
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);  // Track which list is being edited
  const [editedName, setEditedName] = useState("");

  const lists = Array.isArray(listSummaries) ? listSummaries : [];

  /** Handle form submit to create a new list */
  function onSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    handleNewToDoList(newName.trim());
    setNewName("");
  }

  /** Handle update of list name */
  function handleSaveUpdate(id) {
    if (!editedName.trim()) return;
    handleUpdateToDoList(id, editedName.trim());
    setEditingId(null); // Exit editing mode
    setEditedName(""); // Clear the edited name
  }

  /** Handle cancel edit */
  function handleCancelUpdate() {
    setEditingId(null);
    setEditedName("");
  }

  return (
    <div className="ListTodoLists">
      <h1>Your To‑Do Lists</h1>

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

      {listSummaries == null ? (
        <div className="loading-spinner"></div>
      ) : lists.length === 0 ? (
        <p>No lists yet.</p>
      ) : (
        <ul className="list-summaries">
          {lists.map((list) => (
            <li key={list.id} className="list-summary">
              <div className="list-info">
                {editingId === list.id ? (
                  <div className="edit-list-name">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="edit-input"
                    />
                    <button onClick={() => handleSaveUpdate(list.id)} className="save-button">Save</button>
                    <button onClick={handleCancelUpdate} className="cancel-button">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span>{list.name}</span>
                    <span className="item-count">Click to view items</span>
                  </>
                )}
              </div>
              <div className="list-actions">
                {editingId === list.id ? null : (
                  <button
                    onClick={() => {
                      setEditingId(list.id);
                      setEditedName(list.name);  // Populate the current name for editing
                    }}
                    className="edit-button"
                    aria-label={`Edit ${list.name}`}
                  >
                    ✏️ {/* Update icon */}
                  </button>
                )}
                <button
                  className="delete-button"
                  onClick={() => handleDeleteToDoList(list.id)}
                  aria-label={`Delete ${list.name}`}
                >
                  ×
                </button>
                <button
                  onClick={() => handleSelectList(list.id)}
                  aria-label={`Select ${list.name}`}
                  style={{ display: 'none' }} // Triggering via entire list click
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  handleUpdateToDoList: PropTypes.func.isRequired, // Adding the prop for updating the list name
};

ListToDoLists.defaultProps = {
  listSummaries: null,
};
