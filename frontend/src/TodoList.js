import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BiSolidTrash } from 'react-icons/bi';
import './TodoList.css';

/**
 * TodoList Component
 * 
 * Handles displaying, adding, deleting, and updating items in a to-do list.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.listId - The ID of the selected to-do list
 * @param {Function} props.handleBackButton - Function to navigate back to the main list view
 */
function TodoList({ listId, handleBackButton }) {
    // Reference for input field
    const labelRef = useRef();
    
    // State to store the data of the selected to-do list
    const [listData, setListData] = useState(null);

    /**
     * Fetches the selected to-do list data when the component mounts or listId changes.
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`/api/lists/${listId}`);
                setListData(response.data);
            } catch (error) {
                console.error("Error fetching list data:", error);
            }
        };
        fetchData();
    }, [listId]);

    /**
     * Creates a new item in the current to-do list.
     * 
     * @param {string} label - The text label of the new item
     */
    function handleCreateItem(label) {
        const updateData = async () => {
            try {
                const response = await axios.post(`/api/lists/${listData.id}/items`, {
                    label: label,
                });
                setListData(response.data);
            } catch (error) {
                console.error("Error creating item:", error);
            }
        };
        updateData();
    }

    /**
     * Deletes an item from the to-do list.
     * 
     * @param {string} id - The ID of the item to be deleted
     */
    function handleDeleteItem(id) {
        const updateData = async () => {
            try {
                const response = await axios.delete(`/api/lists/${listData.id}/items/${id}`);
                setListData(response.data);
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        };
        updateData();
    }
    
    /**
     * Toggles the checked state of an item in the to-do list.
     * 
     * @param {string} itemId - The ID of the item to toggle
     * @param {boolean} newState - The new checked state of the item
     */
    function handleCheckToggle(itemId, newState) {
        const updateData = async () => {
            try {
                const response = await axios.patch(`/api/lists/${listData.id}/items/${itemId}`, {
                    checked: newState,
                });
                setListData(response.data);
            } catch (error) {
                console.error("Error updating item state:", error);
            }
        };
        updateData();
    }

    if (listData === null) {
        return (
            <div className="TodoList loading">
                <button className="back" onClick={handleBackButton}>Back</button>
                Loading to-do list ...
            </div>
        );
    }

    return (
        <div className="TodoList">
            <button className="back" onClick={handleBackButton}>Back</button>
            <h1>List: {listData.name}</h1>
            <div className="box">
                <label>
                    New Item:&nbsp;
                    <input type="text" ref={labelRef} placeholder="Enter new item" />
                </label>
                <button onClick={() => handleCreateItem(labelRef.current.value)}>New</button>
            </div>
            {listData.items.length > 0 ? (
                listData.items.map((item) => (
                    <div
                        className={item.checked ? "item checked" : "item"}
                        key={item.id}
                        onClick={() => handleCheckToggle(item.id, !item.checked)}>
                        <span>{item.checked ? "✔" : "✘"}</span>
                        <span className="label">{item.label}</span>
                        <span className="flex"></span>
                        <span
                            className="trash"
                            onClick={(evt) => {
                                evt.stopPropagation(); // Prevent event bubbling to parent div
                                handleDeleteItem(item.id);
                            }}
                        >
                            <BiSolidTrash />
                        </span>
                    </div>
                ))
            ) : (
                <div className="box">There are currently no items.</div>
            )}
        </div>
    );
}

export default TodoList;
