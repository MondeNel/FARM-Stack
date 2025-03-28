import { useState, useEffect } from 'react'
import axios from 'axios'
import ListToDoLists from './ListToDoLists'
import TodoList from './TodoList'
import './App.css'

function App() {
  // State to hold the list summaries and selected list
  const [listSummaries, setListSummaries] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [newName, setNewName] = useState("");  // State to hold the new list's name input
  
  // Fetch list summaries when the component mounts
  useEffect(() => {
    reloadData().catch(console.error);
  }, []);

  // Function to reload the data (fetch lists)
  async function reloadData() {
    try {
      const response = await axios.get('/api/todo-lists'); // Fetch the lists from API
      setListSummaries(response.data);  // Set the list summaries to state
    } catch (error) {
      console.error("Error fetching todo lists:", error);
    }
  }

  // Function to handle the creation of a new to-do list
  function handleNewTodoList() {
    const updateData = async () => {
      const newListData = {
        name: newName,  // Use the new name for the list
      }

      try {
        const response = await axios.post('/api/todo-lists', newListData);  // Create the new list via API
        setListSummaries(prevListSummaries => [...prevListSummaries, response.data]);  // Add the new list to the state
        setNewName("");  // Clear the input field
      } catch (error) {
        console.error("Error creating new todo list:", error);
      }
    }

    updateData();  // Call the updateData function
  }

  return (
    <div className="App">
      <h1>Todo List Application</h1>

      {/* Input to add a new list */}
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}  // Update newName as the user types
        placeholder="Enter list name"
      />
      <button onClick={handleNewTodoList}>Create New List</button>

      {/* Render the list of To-Do Lists */}
      {listSummaries ? (
        <ListToDoLists 
          lists={listSummaries} 
          onSelectList={setSelectedList}  // Pass the function to update selected list
        />
      ) : (
        <p>Loading...</p>
      )}

      {/* Render selected Todo list if a list is selected */}
      {selectedList && (
        <TodoList 
          list={selectedList}  // Pass selected list to the TodoList component
        />
      )}
    </div>
  );
}

export default App;
