import { useState, useEffect } from 'react'
import axios from 'axios'
import ListToDoLists from './ListToDoLists'  // Import component to display list of To-Do lists
import TodoList from './TodoList'  // Import component to display the details of a selected To-Do list
import './App.css'

// Main App component that handles fetching, displaying, creating, and deleting to-do lists.
function App() {
  // State to hold the list summaries (list of all to-do lists)
  const [listSummaries, setListSummaries] = useState(null);

  // State to hold the selected to-do list when a user selects one
  const [selectedItem, setSelectedItem] = useState(null);

  // State to hold the input for creating a new to-do list
  const [newName, setNewName] = useState("");  

  // Fetch list summaries when the component mounts
  useEffect(() => {
    reloadData().catch(console.error);  // Fetch data and handle errors
  }, []); // Empty dependency array means this runs only once when the component mounts

  // Function to reload the data (fetch the list of to-do lists from the API)
  async function reloadData() {
    try {
      const response = await axios.get('/api/todo-lists');  // Send GET request to fetch lists from API
      setListSummaries(response.data);  // Set the list of to-do lists to the state
    } catch (error) {
      console.error("Error fetching todo lists:", error);  // Log errors if the request fails
    }
  }

  // Function to handle the creation of a new to-do list
  function handleNewTodoList() {
    const updateData = async () => {
      const newListData = {
        name: newName,  // Name of the new list entered by the user
      };

      // Send the new list data to the API using a POST request
      await axios.post('/api/todo-lists', newListData);  

      // Reload the lists after creating the new one
      reloadData().catch(console.error);  
    };
    updateData();  // Call the function to create the new list and reload the data
  }

  // Function to handle the deletion of a to-do list by its ID
  function handleDeleteTodoList(id) {
    const updateData = async () => {
      // Send DELETE request to remove the to-do list from the API
      await axios.delete(`/api/todo-lists/${id}`);  

      // Reload the lists after deleting the list
      reloadData().catch(console.error);  
    };
    updateData();  // Call the function to delete the list and reload the data
  }

  // Function to handle the selection of a specific to-do list
  function handleSelectedList(id) {
    console.log("Selecting item: ", id);  // Log the selected list ID for debugging
    setSelectedItem(id);  // Set the selected item ID to state
  }

  // Function to go back to the list of all to-do lists
  function backToList() {
    setSelectedItem(null);  // Clear the selected list
    reloadData().catch(console.error);  // Reload the list summaries
  }

  // Main component rendering logic
  if (selectedItem === null) {  // If no list is selected, render the list of all lists
    return (
      <div className="App">
        {/* Render the ListToDoLists component */}
        <ListToDoLists
          listSummaries={listSummaries}  // Pass the list summaries to the component
          handleSelectedList={handleSelectedList}  // Function to handle list selection
          handleNewTodoList={handleNewTodoList}  // Function to handle creating new to-do list
        />
      </div>
    );
  }

  // If a list is selected, render the selected TodoList
  return (
    <div className="App">
      <h1>Todo List Application</h1>

      {/* Input field to add a new list */}
      <input
        type="text"
        value={newName}  // Controlled input for the list's name
        onChange={(e) => setNewName(e.target.value)}  // Update the newName state as the user types
        placeholder="Enter list name"
      />
      <button onClick={handleNewTodoList}>Create New List</button>  {/* Button to trigger list creation */}

      {/* Render the list of To-Do Lists if data is available */}
      {listSummaries ? (
        <ListToDoLists 
          lists={listSummaries}  // Pass the lists to the ListToDoLists component
          onSelectList={setSelectedList}  // Pass the function to update selected list
        />
      ) : (
        <p>Loading...</p>  // Display loading message while the data is being fetched
      )}

      {/* Render the selected To-Do list if available */}
      {selectedItem && (
        <TodoList 
          list={selectedItem}  // Pass the selected list to the TodoList component
        />
      )}
    </div>
  );
}

export default App;  // Export the App component for use in other parts of the application
