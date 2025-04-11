import { useState } from "react";
import PropTypes from "prop-types";
import './ListToDoLists.css';

/**
 * @typedef {Object} ListSummary
 * @property {string} id
 * @property {string} name
 */

/**
 * Displays all to‑do lists, allows creation and deletion.
 *
 * @param {{ 
 *   listSummaries: ListSummary[] | null,
 *   handleSelectList: (id: string) => void,
 *   handleNewToDoList: (name: string) => void,
 *   handleDeleteToDoList: (id: string) => void
 * }} props
 */
export default function ListToDoLists({
  listSummaries,
  handleSelectList,
  handleNewToDoList,
  handleDeleteToDoList,
}) {
  const [newName, setNewName] = useState("");

  const lists = Array.isArray(listSummaries) ? listSummaries : [];

  /** Handle form submit to create a new list */
  function onSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    handleNewToDoList(newName.trim());
    setNewName("");
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
                <span>{list.name}</span>
                <span className="item-count">Click to view items</span>
              </div>
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
};

ListToDoLists.defaultProps = {
  listSummaries: null,
};
