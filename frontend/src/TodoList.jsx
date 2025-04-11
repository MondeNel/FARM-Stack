import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

/**
 * @typedef {Object} ToDoItem
 * @property {string} id
 * @property {string} label
 * @property {boolean} checked
 */

/**
 * Renders a single to‑do list, with ability to add, toggle, and delete items.
 *
 * @param {{
 *   listId: string,
 *   handleBackButton: () => void
 * }} props
 */
export default function ToDoList({ listId, handleBackButton }) {
  const [listName, setListName] = useState("");
  const [items, setItems] = useState(/** @type {ToDoItem[]} */ ([]));
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  /** Load list from backend, then sync to LocalStorage */
  async function loadList() {
    const resp = await axios.get(`/api/lists/${listId}`);
    const data = resp.data;
    setListName(data.name);
    setItems(data.items);

    // Sync into LocalStorage
    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(data.items)
    );
  }

  /** Add a new item */
  async function addItem(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const resp = await axios.post(`/api/lists/${listId}/items`, {
      label: newLabel.trim(),
    });
    const added = resp.data;
    const updated = [...items, added];
    setItems(updated);
    setNewLabel("");

    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(updated)
    );
  }

  /**
   * Toggle an item’s checked state
   * @param {ToDoItem} item
   */
  async function toggleItem(item) {
    const resp = await axios.patch(`/api/lists/${listId}/checked_state`, {
      item_id: item.id,
      checked_state: !item.checked,
    });
    const updatedItem = resp.data;
    const updated = items.map((it) =>
      it.id === updatedItem.id ? updatedItem : it
    );
    setItems(updated);
    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(updated)
    );
  }

  /**
   * Delete an item
   * @param {string} itemId
   */
  async function deleteItem(itemId) {
    await axios.delete(`/api/lists/${listId}/items/${itemId}`);
    const updated = items.filter((it) => it.id !== itemId);
    setItems(updated);
    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(updated)
    );
  }

  return (
    <div className="todo-list">
      <button onClick={handleBackButton}>← Back to lists</button>
      <h2>{listName}</h2>

      <form onSubmit={addItem}>
        <input
          type="text"
          placeholder="New item"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <label>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem(item)}
                />
                {item.label}
              </label>
              <button
                onClick={() => deleteItem(item.id)}
                aria-label={`Delete ${item.label}`}
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

ToDoList.propTypes = {
  listId: PropTypes.string.isRequired,
  handleBackButton: PropTypes.func.isRequired,
};
