import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import './ToDoList.css';

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
  const [editingId, setEditingId] = useState(null);
  const [editedLabel, setEditedLabel] = useState("");

  useEffect(() => {
    loadList();
  }, [listId]);

  async function loadList() {
    const resp = await axios.get(`/api/lists/${listId}`);
    const data = resp.data;
    setListName(data.name);
    setItems(data.items);
    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(data.items)
    );
  }

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
    setEditingId(added.id);  // Automatically focus on the newly added item to edit
    setEditedLabel(added.label);  // Set label for editing
    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(updated)
    );
  }

  async function toggleItem(item) {
    const resp = await axios.patch(`/api/lists/${listId}/items/${item.id}`, {
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

  async function deleteItem(itemId) {
    await axios.delete(`/api/lists/${listId}/items/${itemId}`);
    const updated = items.filter((it) => it.id !== itemId);
    setItems(updated);
    window.localStorage.setItem(
      `todo-list-${listId}`,
      JSON.stringify(updated)
    );
  }

  async function updateItemLabel(itemId) {
    const trimmed = editedLabel.trim();
    if (!trimmed) return;

    const resp = await axios.patch(`/api/lists/${listId}/items/${itemId}`, {
      label: trimmed,
    });

    const updatedItem = resp.data;
    const updated = items.map((it) =>
      it.id === updatedItem.id ? updatedItem : it
    );

    setItems(updated);
    setEditingId(null);
    setEditedLabel("");

    window.localStorage.setItem(`todo-list-${listId}`, JSON.stringify(updated));
  }

  return (
    <div className="ToDoList">
      <button className="back-button" onClick={handleBackButton}>← Back to lists</button>
      <h2 className="list-title">{listName}</h2>

      <form onSubmit={addItem} className="item-form">
        <input
          className="item-input"
          type="text"
          placeholder="New item"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <button className="item-add-button" type="submit">Add</button>
      </form>

      {items.length === 0 ? (
        <p className="empty-state">No items yet.</p>
      ) : (
        <ul className="items-list">
          {items.map((item) => (
            <li key={item.id} className="item">
              {item.id === editingId ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateItemLabel(item.id);
                  }}
                  className="edit-form"
                >
                  <input
                    type="text"
                    value={editedLabel}
                    onChange={(e) => setEditedLabel(e.target.value)}
                    className="edit-input"
                  />
                  <button type="submit" className="save-button">Save</button>
                  <button type="button" className="cancel-button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <label className="item-label">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item)}
                    />
                    <span className={item.checked ? "checked" : ""}>{item.label}</span>
                  </label>
                  <div className="item-actions">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditedLabel(item.label);
                      }}
                      className="edit-button"
                    >
                      🖉  {/* Update icon */}
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="item-delete-button"
                      aria-label={`Delete ${item.label}`}
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
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
