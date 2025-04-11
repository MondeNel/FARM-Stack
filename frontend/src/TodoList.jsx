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
 * Renders a single to‑do list, with the ability to add, toggle, and delete items.
 *
 * @param {Object} props
 * @param {string} props.listId
 * @param {() => void} props.handleBackButton
 */
export default function ToDoList({ listId, handleBackButton }) {
  const [listName, setListName] = useState("");
  const [items, setItems] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedLabel, setEditedLabel] = useState("");

  useEffect(() => {
    loadList();
  }, [listId]);

  /**
   * Fetches the list data from the server and sets it to state.
   */
  async function loadList() {
    const { data } = await axios.get(`/api/lists/${listId}`);
    setListName(data.name);
    setItems(data.items);
    window.localStorage.setItem(`todo-list-${listId}`, JSON.stringify(data.items));
  }

  /**
   * Adds a new item to the list.
   * 
   * @param {React.FormEvent} e
   */
  async function addItem(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const { data: added } = await axios.post(`/api/lists/${listId}/items`, {
      label: newLabel.trim(),
    });

    const updatedItems = [...items, added];
    setItems(updatedItems);
    setNewLabel("");
    setEditingId(added.id);
    setEditedLabel(added.label);
    window.localStorage.setItem(`todo-list-${listId}`, JSON.stringify(updatedItems));
  }

  /**
   * Toggles the checked state of an item.
   * 
   * @param {ToDoItem} item
   */
  async function toggleItem(item) {
    const { data: updatedItem } = await axios.patch(`/api/lists/${listId}/items/${item.id}`, {
      checked_state: !item.checked,
    });

    const updatedItems = items.map((it) => it.id === updatedItem.id ? updatedItem : it);
    setItems(updatedItems);
    window.localStorage.setItem(`todo-list-${listId}`, JSON.stringify(updatedItems));
  }

  /**
   * Deletes an item from the list.
   * 
   * @param {string} itemId
   */
  async function deleteItem(itemId) {
    await axios.delete(`/api/lists/${listId}/items/${itemId}`);
    const updatedItems = items.filter((it) => it.id !== itemId);
    setItems(updatedItems);
    window.localStorage.setItem(`todo-list-${listId}`, JSON.stringify(updatedItems));
  }

  /**
   * Updates the label of an item.
   * 
   * @param {string} itemId
   */
  async function updateItemLabel(itemId) {
    const trimmedLabel = editedLabel.trim();
    if (!trimmedLabel) return;

    const { data: updatedItem } = await axios.patch(`/api/lists/${listId}/items/${itemId}`, {
      label: trimmedLabel,
    });

    const updatedItems = items.map((it) => it.id === updatedItem.id ? updatedItem : it);
    setItems(updatedItems);
    setEditingId(null);
    setEditedLabel("");
    window.localStorage.setItem(`todo-list-${listId}`, JSON.stringify(updatedItems));
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
                      🖉
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
