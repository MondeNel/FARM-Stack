import React, { useRef } from 'react';
import { BiSolidTrash } from 'react-icons/bi';
import './ListTodoLists.css';

/**
 * ListToDoLists Component
 * 
 * This component displays a list of to-do lists with options to create, select, and delete lists.
 * 
 * @param {Object[]} listSummaries - Array of to-do list summaries.
 * @param {Function} handleSelectedList - Function to handle selecting a to-do list.
 * @param {Function} handleNewTodoList - Function to create a new to-do list.
 * @param {Function} handleDeleteTodoList - Function to delete a to-do list.
 */
function ListToDoLists({
    listSummaries,
    handleSelectedList,
    handleNewTodoList,
    handleDeleteTodoList,
}) {
    // useRef to store the input field reference for creating a new to-do list
    const labelRef = useRef();

    // Display loading message while data is being fetched
    if (listSummaries === null) {
        return <div className="ListTodoLists loading">Loading to-do lists...</div>;
    }

    // Display message when there are no to-do lists available
    if (listSummaries.length === 0) {
        return (
            <div className="ListTodoLists">
                <div className="box">
                    <label>
                        New To-Do List:&nbsp;
                        {/* Input field for new to-do list name */}
                        <input type="text" ref={labelRef} placeholder="Enter list name" />
                    </label>
                    <button
                        onClick={() => {
                            handleNewTodoList(labelRef.current.value); // Create new to-do list
                        }}
                    >
                        New
                    </button>
                </div>
                <p>There are no to-do lists!</p>
            </div>
        );
    }

    return (
        <div className="ListTodoLists">
            <h1>All To-Do Lists</h1>

            {/* Section to add a new to-do list */}
            <div className="box">
                <label>
                    New To-Do List:&nbsp;
                    <input type="text" ref={labelRef} placeholder="Enter list name" />
                </label>
                <button
                    onClick={() => {
                        handleNewTodoList(labelRef.current.value); // Create new to-do list
                    }}
                >
                    New
                </button>
            </div>

            {/* Render all existing to-do lists */}
            {listSummaries.map((summary) => (
                <div 
                    key={summary.id} 
                    className="summary"
                    onClick={() => handleSelectedList(summary.id)} // Handle list selection
                >
                    <span className='name'>{summary.name}</span>
                    <span className='count'>({summary.item_count} items)</span>
                    <span className='flex'></span>
                    
                    {/* Delete button */}
                    <span
                        className='trash'
                        onClick={(evt) => {
                            evt.stopPropagation(); // Prevent event bubbling to avoid selecting the list
                            handleDeleteTodoList(summary.id); // Delete the selected list
                        }}
                    >
                        <BiSolidTrash />
                    </span>
                </div>
            ))}
        </div>
    );
}

export default ListToDoLists;
