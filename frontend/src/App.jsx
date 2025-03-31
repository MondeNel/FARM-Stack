import { useState, useEffect } from 'react';
import axios from 'axios';
import ListToDoLists from './ListTodoLists';  
import TodoList from './TodoList'; 
import './App.css';

// Main App component that handles fetching, displaying, creating, and deleting to-do lists.
function App() {
  // State to hold the list summaries (list of all to-do lists)
  const [listSummaries, setListSummaries] = useState(null);

  // State to hold the selected to-do list when a user selects one
  const [selectedItem, setSelectedItem] = useState(null);

  // State to hold the input for creating a new to-do list
  const [newName, setNewName] = useState('');  

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
      console.error('Error fetching todo lists:', error);  // Log errors if the request fails
    }
  }

  // Function to handle the creation of a new to-do list
  async function handleNewTodoList() {
    try {
      const newListData = { name: newName };  // Name of the new list entered by the user
      await axios.post('/api/todo-lists', newListData);  // Send POST request to create a new list
      reloadData();  // Reload the lists after creating the new one
    } catch (error) {
      console.error('Error creating new list:', error);
    }
  }

  // Function to handle the deletion of a to-do list by its ID
  async function handleDeleteTodoList(id) {
    try {
      await axios.delete(`/api/todo-lists/${id}`);  // Send DELETE request to remove the to-do list
      reloadData();  // Reload the lists after deleting the list
    } catch (error) {
      console.error('Error deleting todo list:', error);
    }
  }

  // Function to handle the selection of a specific to-do list
  function handleSelectedList(id) {
    console.log('Selecting item:', id);  // Log the selected list ID for debugging
    setSelectedItem(id);  // Set the selected item ID to state
  }

  // Function to go back to the list of all to-do lists
  function backToList() {
    setSelectedItem(null);  // Clear the selected list
    reloadData().catch(console.error);  // Reload the list summaries
  }

  return (
    <div className="App">
      {selectedItem === null ? (
        // If no list is selected, render the list of all lists
        <ListToDoLists
          listSummaries={listSummaries}  // Pass the list summaries to the component
          handleSelectedList={handleSelectedList}  // Function to handle list selection
          handleNewTodoList={handleNewTodoList}  // Function to handle creating new to-do list
        />
      ) : (
        // If a list is selected, render the TodoList component
        <TodoList listId={selectedItem} handleBackButton={backToList} />
      )}
    </div>
  );
}

export default App;  // Export the App component for use in other parts of the application