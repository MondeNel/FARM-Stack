import { useState } from "react";
import PropTypes from "prop-types";


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

  // Ensure we always have an array to map over
  const lists = Array.isArray(listSummaries) ? listSummaries : [];

  /** Handle form submit to create a new list */
  function onSubmit(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    handleNewToDoList(newName.trim());
    setNewName("");
  }

  return (
    <div className="list-container">
      <h1>Your To‑Do Lists</h1>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="New list name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">Create</button>
      </form>

      {listSummaries == null ? (
        <p>Loading…</p>
      ) : lists.length === 0 ? (
        <p>No lists yet.</p>
      ) : (
        <ul>
          {lists.map((list) => (
            <li key={list.id}>
              <button onClick={() => handleSelectList(list.id)}>
                {list.name}
              </button>
              <button
                onClick={() => handleDeleteToDoList(list.id)}
                aria-label={`Delete ${list.name}`}
              >
                ×
              </button>
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

// If someone forgets to pass listSummaries, default to null (so we show Loading…)
ListToDoLists.defaultProps = {
  listSummaries: null,
};
