# Jules Kanban Project

A sleek, interactive multi-board Kanban system to help you organize and manage your tasks efficiently. Built with HTML, CSS, and JavaScript, featuring a modern liquid-glass design with light and dark themes.

## Features

*   **Multiple Kanban Boards:** Create and manage multiple distinct Kanban boards.
*   **Persistent Storage:** All boards and tasks are saved in your browser's local storage.
*   **Editable Board Names:** Easily rename your Kanban boards by clicking on their titles.
*   **Dynamic Task Management:**
    *   Create tasks within any column ("To Do", "In Progress", "Done").
    *   Edit task content directly on the card.
    *   Delete tasks.
*   **Drag & Drop:** Intuitively move tasks between columns and reorder them within a column. Supports both mouse and touch interactions.
*   **Themeable UI:** Switch between a dark and a light theme, both styled with a liquid-glass effect. Theme preference is also saved.
*   **Enhanced Home Page:** Improved visual styling for board cards, buttons, and layout, consistent with the liquid glass theme.
*   **Custom Dialogs:** Modern, themed dialog for creating new boards, replacing browser defaults.
*   **Responsive Design:** Adapts to various screen sizes, including desktop, tablet, and mobile.

## How to Use

### Main Page (`main.html`)

1.  **Opening the Application:**
    *   When you first open `main.html`, you'll see the "Jules Kanban" title and a list of any existing boards.
    *   If no boards exist, a message will prompt you to create one.

2.  **Creating a New Board:**
    *   Click the "Create New Board" button.
    *   A custom dialog will appear. Enter a name for your new board in the input field.
    *   Click "Create Board" or press Enter.
    *   Upon creation, you will be automatically navigated to the new board's page. Click "Cancel" or click outside the dialog to close it without creating a board.

3.  **Accessing an Existing Board:**
    *   Click on any of the board cards displayed on the main page to open that specific Kanban board.

4.  **Switching Themes:**
    *   Use the theme toggle switch (sun/moon icon) located at the top-right of the page to switch between light and dark themes. Your preference is saved.

### Board Page (`index.html`)

1.  **Board Name:**
    *   The name of the current board is displayed at the top.
    *   **Editing the Board Name:** Hover over the board name, and an edit (pencil) icon will appear. Click either the name or the icon to make the name editable. Type the new name and press Enter or click outside the input field to save.

2.  **Navigating Home:**
    *   Click the "Home" button (house icon) at the top-left to return to the main page listing all your boards.

3.  **Adding a Task:**
    *   In any column ("To Do", "In Progress", "Done"), type your task description into the input field at the bottom of that column.
    *   Click the "Add Task" button below the input field, or press Enter.

4.  **Editing a Task:**
    *   Hover over a task card. An edit (pencil) icon will appear.
    *   Click the edit icon. The task text will become an editable textarea.
    *   Modify the text and click the save (checkmark) icon that replaced the edit icon.

5.  **Deleting a Task:**
    *   Hover over a task card. A delete (X) icon will appear.
    *   Click the delete icon to remove the task.

6.  **Moving a Task:**
    *   Click and hold (or tap and hold on touch devices) on a task card.
    *   Drag the card to the desired column or a new position within the same column.
    *   Release the mouse button (or lift your finger) to drop the task.

7.  **Task Persistence:**
    *   All changes to tasks (creation, editing, deletion, movement) and board names are automatically saved to local storage.

## Project Structure

*   `index.html`: The main landing page (formerly `main.html`). Displays existing boards and allows creation of new boards.
*   `board.html`: The template for individual Kanban board pages (formerly `index.html`).
*   `README.md`: This file.
*   `assets/`: Directory for storing static assets.
    *   `css/`: Contains stylesheets.
        *   `style.css`: Global styles, themes, and base layout elements.
        *   `main.css`: Styles specific to `index.html` (the main page).
        *   `board.css`: Styles specific to `board.html` (the board page).
    *   `js/`: Contains JavaScript files.
        *   `main.js`: Logic for `index.html` (main page), including board listing, creation, and navigation.
        *   `board.js`: Logic for `board.html` (board page), including task management, theme switching, and editable board names.

## Local Storage Structure

*   **`julesKanbanBoardsList`**: A JSON stringified array of objects, where each object contains `{id: "board-unique-id", name: "Board Name"}`. This list is used by `main.html` to display available boards.
*   **`julesKanbanBoard_<board-unique-id>`**: For each board, a separate local storage item is created. The key is prefixed with `julesKanbanBoard_` followed by the board's unique ID. The value is a JSON stringified object representing the board's data, structured like:
    ```json
    {
      "id": "board-unique-id",
      "name": "My Project Board",
      "columns": {
        "todo": [
          { "id": "task-id-1", "text": "Design homepage" },
          { "id": "task-id-2", "text": "Setup database" }
        ],
        "inprogress": [
          { "id": "task-id-3", "text": "Develop API endpoints" }
        ],
        "done": []
      }
    }
    ```
*   **`theme`**: Stores the user's theme preference ("light" or "dark").
