# Jules Kanban Board

A simple, interactive Kanban board to help you manage your tasks. Built with HTML, CSS, and JavaScript.

## Features

*   **Create Tasks:** Easily add new tasks to any column.
*   **Drag & Drop:** Move tasks between "To Do", "In Progress", and "Done" columns.
*   **Persistent Storage:** Tasks are saved in your browser's local storage, so they'll be there when you come back!
*   **Responsive Design:** Works on desktop, tablet, and mobile devices.

## How to Use

1.  **Adding a Task:**
    *   Type your task description into the input field at the bottom of the desired column (e.g., "To Do").
    *   Click the "Add Task" button.

2.  **Moving a Task:**
    *   Click and hold on a task card.
    *   Drag the card to the desired column.
    *   Release the mouse button to drop the task in its new column.

3.  **Task Persistence:**
    *   Your tasks are automatically saved as you add or move them.
    *   When you reopen the Kanban board in the same browser, your tasks will be reloaded.

## Project Structure

*   `index.html`: The main HTML file for the structure of the board.
*   `style.css`: Contains all the styles for the board, including responsiveness.
*   `script.js`: Handles the JavaScript logic for task creation, drag & drop functionality, and local storage.
