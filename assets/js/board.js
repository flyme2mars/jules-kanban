document.addEventListener('DOMContentLoaded', () => {
    const KANBAN_BOARDS_LIST_KEY = 'julesKanbanBoardsList'; // Stores array of {id, name}
    const KANBAN_BOARD_DATA_PREFIX = 'julesKanbanBoard_';

    let currentBoardId = null;
    let currentBoardData = null;

    const boardNameDisplay = document.getElementById('board-name-display');
    const boardNameInput = document.getElementById('board-name-input');
    const editBoardNameIcon = document.getElementById('edit-board-name-icon');
    const boardHeader = document.querySelector('.board-header');

    const addTaskButtons = document.querySelectorAll('.add-task-btn');
    const taskInputs = document.querySelectorAll('.new-task-input');
    const columnsTasksContainers = document.querySelectorAll('.column .tasks');
    const columns = document.querySelectorAll('.column'); // todo, inprogress, done
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    const bodyElement = document.body;

    let draggedTask = null;

    function getBoardIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('boardId');
    }

    function loadBoardData(boardId) {
        const data = localStorage.getItem(`${KANBAN_BOARD_DATA_PREFIX}${boardId}`);
        if (data) {
            return JSON.parse(data);
        }
        // Attempt to get name from boards list if direct data is missing (e.g. old board format)
        const boardsList = JSON.parse(localStorage.getItem(KANBAN_BOARDS_LIST_KEY) || '[]');
        const boardInfo = boardsList.find(b => b.id === boardId);
        if (boardInfo) {
            return { // Return a default structure
                id: boardId,
                name: boardInfo.name,
                columns: { todo: [], inprogress: [], done: [] }
            };
        }
        return null; // Board not found
    }

    function saveCurrentBoardData() {
        if (currentBoardData && currentBoardId) {
            localStorage.setItem(`${KANBAN_BOARD_DATA_PREFIX}${currentBoardId}`, JSON.stringify(currentBoardData));
        }
    }

    function updateBoardNameInList(boardId, newName) {
        let boardsList = JSON.parse(localStorage.getItem(KANBAN_BOARDS_LIST_KEY) || '[]');
        const boardIndex = boardsList.findIndex(b => b.id === boardId);
        if (boardIndex > -1) {
            boardsList[boardIndex].name = newName;
            localStorage.setItem(KANBAN_BOARDS_LIST_KEY, JSON.stringify(boardsList));
        }
    }


    // --- Board Name Editing Logic ---
    function enableBoardNameEditing() {
        boardNameDisplay.style.display = 'none';
        editBoardNameIcon.style.display = 'none';
        boardNameInput.style.display = 'inline-block';
        boardNameInput.value = currentBoardData.name;
        boardNameInput.focus();
        boardNameInput.select();
    }

    function disableBoardNameEditing() {
        const newName = boardNameInput.value.trim();
        if (newName && newName !== currentBoardData.name) {
            currentBoardData.name = newName;
            boardNameDisplay.textContent = newName;
            document.title = `${newName} - Jules Kanban`;
            saveCurrentBoardData();
            updateBoardNameInList(currentBoardId, newName);
        } else {
            // Restore original name if input is empty or unchanged
            boardNameDisplay.textContent = currentBoardData.name;
        }
        boardNameDisplay.style.display = 'inline-block'; // or block if it was
        boardNameInput.style.display = 'none';
        // editBoardNameIcon will be shown by hover logic
    }

    if (boardNameDisplay && boardNameInput && editBoardNameIcon && boardHeader) {
        boardNameDisplay.addEventListener('click', enableBoardNameEditing);
        editBoardNameIcon.addEventListener('click', enableBoardNameEditing);

        boardNameInput.addEventListener('blur', disableBoardNameEditing);
        boardNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                boardNameInput.blur(); // Trigger blur to save
            }
        });

        boardHeader.addEventListener('mouseenter', () => {
            if (boardNameInput.style.display === 'none') { // Only show if not editing
                editBoardNameIcon.style.display = 'inline-block';
            }
        });
        boardHeader.addEventListener('mouseleave', () => {
            editBoardNameIcon.style.display = 'none';
        });
    }
    // --- End Board Name Editing Logic ---


    // Theme switching logic (no changes needed, it's self-contained)
    function setTheme(isLightMode) {
        if (isLightMode) {
            bodyElement.classList.add('light-mode');
            if(themeSwitch) themeSwitch.checked = true;
            localStorage.setItem('theme', 'light');
        } else {
            bodyElement.classList.remove('light-mode');
            if(themeSwitch) themeSwitch.checked = false;
            localStorage.setItem('theme', 'dark');
        }
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            setTheme(themeSwitch.checked);
        });
    }

    // Load saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        setTheme(true);
    } else {
        setTheme(false); // Default to dark mode if no preference or preference is 'dark'
    }

    function generateId() { // For tasks
        return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    function saveTasksToBoardData() {
        if (!currentBoardData) return;

        currentBoardData.columns = { todo: [], inprogress: [], done: [] }; // Reset tasks for current board

        columns.forEach(column => {
            const columnId = column.id; // 'todo', 'inprogress', 'done'
            const tasksInColumn = column.querySelectorAll('.tasks .task');

            if (!currentBoardData.columns[columnId]) {
                currentBoardData.columns[columnId] = []; // Should already be initialized
            }

            tasksInColumn.forEach(taskElement => {
                const textSpan = taskElement.querySelector('.task-text-content');
                if (textSpan) {
                    currentBoardData.columns[columnId].push({
                        id: taskElement.id,
                        text: textSpan.textContent.trim()
                    });
                } else {
                    console.warn(`Task element with ID ${taskElement.id} is missing 'task-text-content' span.`);
                    // Fallback might be needed if old data format exists
                    currentBoardData.columns[columnId].push({
                        id: taskElement.id,
                        text: taskElement.textContent.replace(/X$/, '').trim() // Basic fallback
                    });
                }
            });
        });
        saveCurrentBoardData();
    }

    function loadTasksFromBoardData() {
        if (!currentBoardData || !currentBoardData.columns) {
            console.warn('No board data or columns found to load tasks from.');
             // Initialize if completely empty (should be done by main.js or loadBoardData)
            if (!currentBoardData.columns) {
                currentBoardData.columns = { todo: [], inprogress: [], done: [] };
            }
            // return; // No tasks to load
        }

        // Clear existing tasks from UI before loading
        columnsTasksContainers.forEach(container => container.innerHTML = '');

        for (const columnId in currentBoardData.columns) { // columnId is 'todo', 'inprogress', 'done'
            const columnElement = document.getElementById(columnId);
            if (columnElement) {
                const tasksContainer = columnElement.querySelector('.tasks');
                if (tasksContainer && currentBoardData.columns[columnId]) {
                    currentBoardData.columns[columnId].forEach(taskData => {
                        if (taskData && typeof taskData.text === 'string' && typeof taskData.id === 'string') {
                            const taskElement = createTaskElement(taskData.text, taskData.id);
                            tasksContainer.appendChild(taskElement);
                        } else {
                            console.warn('Skipping invalid task data during load:', taskData);
                        }
                    });
                }
            } else {
                console.warn(`Column element with ID ${columnId} not found in DOM.`);
            }
        }
    }


    function createTaskElement(taskText, taskId = null) {
        const task = document.createElement('div');
        task.classList.add('task');
        task.setAttribute('draggable', 'true');
        task.id = taskId || generateId();

        // Create a span for the task text
        const textSpan = document.createElement('span');
        textSpan.classList.add('task-text-content');
        textSpan.textContent = taskText;
        task.appendChild(textSpan);

        const editBtn = document.createElement('span');
        editBtn.classList.add('edit-task-btn');
        editBtn.innerHTML = '&#9998;'; // Pencil icon
        editBtn.addEventListener('click', () => {
            if (task.classList.contains('editing')) {
                // Currently in edit mode, so save
                const textarea = task.querySelector('.edit-task-textarea');
                textSpan.textContent = textarea.value;
                task.replaceChild(textSpan, textarea);
                task.classList.remove('editing');
                task.classList.remove('task-editing-state'); // Remove state class
                editBtn.innerHTML = '&#9998;'; // Pencil icon
                deleteBtn.style.display = ''; // Restore default display behavior for delete button
                task.setAttribute('draggable', 'true'); // Re-enable dragging
                saveTasksToBoardData(); // UPDATED
            } else {
                // Not in edit mode, so switch to edit
                const currentText = textSpan.textContent;
                const textarea = document.createElement('textarea');
                textarea.classList.add('edit-task-textarea');
                textarea.value = currentText;
                task.replaceChild(textarea, textSpan);
                task.classList.add('editing');
                task.classList.add('task-editing-state'); // Add state class
                editBtn.innerHTML = '&#10004;'; // Checkmark icon for Save
                deleteBtn.style.display = 'none'; // Hide delete button
                task.setAttribute('draggable', 'false'); // Disable dragging while editing
                textarea.focus();
                // Auto-adjust textarea height
                textarea.style.height = 'auto';
                textarea.style.height = (textarea.scrollHeight) + 'px';
                textarea.addEventListener('input', () => {
                    textarea.style.height = 'auto';
                    textarea.style.height = (textarea.scrollHeight) + 'px';
                });
            }
        });

        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('delete-task-btn');
        deleteBtn.textContent = 'X';
        deleteBtn.addEventListener('click', () => {
            task.remove();
            saveTasksToBoardData(); // UPDATED
        });

        task.appendChild(editBtn);
        task.appendChild(deleteBtn);

        task.addEventListener('dragstart', (e) => {
            if (task.classList.contains('editing')) {
                e.preventDefault(); // Prevent dragging if in edit mode
                return;
            }
            handleDragStart(e);
        });
        task.addEventListener('dragend', handleDragEnd);

        // Touch event listeners
        task.addEventListener('touchstart', handleTouchStart);
        task.addEventListener('touchmove', handleTouchMove);
        task.addEventListener('touchend', handleTouchEnd);

        return task;
    }

    addTaskButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const inputField = taskInputs[index];
            // const tasksContainer = columnsTasksContainers[index]; // Not directly needed for adding
            const parentColumnElement = inputField.closest('.column');
            if (!parentColumnElement) {
                console.error('Could not find parent column for task input.');
                return;
            }
            const tasksContainer = parentColumnElement.querySelector('.tasks');


            const taskText = inputField.value.trim();

            if (taskText === '') {
                console.warn('Attempted to add an empty task.');
                inputField.focus();
                return;
            }

            const newTask = createTaskElement(taskText);
            tasksContainer.appendChild(newTask);
            inputField.value = '';
            saveTasksToBoardData(); // UPDATED
        });
    });

    taskInputs.forEach((inputField, index) => {
        inputField.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                // Find the button within the same column as the input field
                const parentColumn = inputField.closest('.column');
                if (parentColumn) {
                    const addButton = parentColumn.querySelector('.add-task-btn');
                    if (addButton) {
                        addButton.click();
                    }
                }
            }
        });
    });

    function handleDragStart(e) {
        draggedTask = e.target;
        if (!draggedTask.classList.contains('task')) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            if(draggedTask) draggedTask.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(e) {
        if (draggedTask && draggedTask.classList.contains('task')) {
            draggedTask.classList.remove('dragging');
        }
        draggedTask = null;
        columns.forEach(column => column.classList.remove('drag-over'));
        saveTasksToBoardData(); // UPDATED
    }

    // Touch event handlers (no change in logic, but calls saveTasksToBoardData)
    let initialTouchX = 0;
    let initialTouchY = 0;

    function handleTouchStart(e) {
        if (e.target.classList.contains('task')) {
            // Potential: e.preventDefault(); if issues with scrolling vs dragging
        }
        draggedTask = e.target.closest('.task'); // Ensure we get the task if a child is touched
        if (!draggedTask || draggedTask.classList.contains('editing')) {
            draggedTask = null;
            return;
        }

        draggedTask.classList.add('dragging');
        const touch = e.touches[0];
        initialTouchX = touch.clientX;
        initialTouchY = touch.clientY;
        draggedTask.dataset.initialTouchX = touch.clientX;
        draggedTask.dataset.initialTouchY = touch.clientY;
    }

    function handleTouchMove(e) {
        if (!draggedTask) return;
        e.preventDefault();

        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;

        let elementUnderTouch = document.elementFromPoint(currentX, currentY);
        let targetColumn = null;
        let tasksContainerUnderTouch = null;

        while (elementUnderTouch) {
            if (elementUnderTouch.classList && elementUnderTouch.classList.contains('column')) {
                targetColumn = elementUnderTouch;
                tasksContainerUnderTouch = targetColumn.querySelector('.tasks');
                break;
            }
            elementUnderTouch = elementUnderTouch.parentElement;
        }

        columns.forEach(col => col.classList.remove('drag-over'));

        if (targetColumn && tasksContainerUnderTouch) {
            targetColumn.classList.add('drag-over');
            const tasksInColumn = [...tasksContainerUnderTouch.querySelectorAll('.task:not(.dragging)')];
            let nextTaskElement = null;

            for (const task of tasksInColumn) {
                const rect = task.getBoundingClientRect();
                if (currentY < rect.top + rect.height / 2) {
                    nextTaskElement = task;
                    break;
                }
            }
            if (draggedTask.parentNode !== tasksContainerUnderTouch || nextTaskElement !== draggedTask.nextSibling) {
                 if (nextTaskElement) {
                    tasksContainerUnderTouch.insertBefore(draggedTask, nextTaskElement);
                } else {
                    tasksContainerUnderTouch.appendChild(draggedTask);
                }
            }
        }
    }

    function handleTouchEnd(e) {
        if (draggedTask) {
            draggedTask.classList.remove('dragging');
            delete draggedTask.dataset.initialTouchX;
            delete draggedTask.dataset.initialTouchY;
        }
        columns.forEach(column => column.classList.remove('drag-over'));
        saveTasksToBoardData(); // UPDATED
        draggedTask = null;
        initialTouchX = 0;
        initialTouchY = 0;
    }


    columns.forEach(column => {
        const tasksContainer = column.querySelector('.tasks');

        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedTask && tasksContainer) {
                column.classList.add('drag-over');
                e.dataTransfer.dropEffect = 'move';

                const mouseY = e.clientY;
                const tasksInColumn = [...tasksContainer.querySelectorAll('.task:not(.dragging)')];
                let nextTask = null;
                for (const task of tasksInColumn) {
                    const rect = task.getBoundingClientRect();
                    if (mouseY < rect.top + rect.height / 2) {
                        nextTask = task;
                        break;
                    }
                }
                // Only move if it's different from current position or different container
                if (draggedTask.parentNode !== tasksContainer || nextTask !== draggedTask.nextSibling) {
                    if (nextTask) {
                        tasksContainer.insertBefore(draggedTask, nextTask);
                    } else {
                        tasksContainer.appendChild(draggedTask);
                    }
                }
            }
        });

        column.addEventListener('dragleave', (e) => {
            // Check if the mouse is leaving the column for real, not just moving over a child element
            if (!column.contains(e.relatedTarget) || e.relatedTarget === null) {
                 column.classList.remove('drag-over');
            }
        });


        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            // Drag end will handle saving. Dragover handles the move.
            // The actual appending to a *new* column if draggedTask.parentNode !== tasksContainer
            // should have been handled by dragover if the drop target is valid.
            // If it's the same column, dragover also handles reordering.
            // So, drop's main job here is to finalize and remove 'drag-over'.
            // The saveTasksToBoardData() in handleDragEnd will capture the final state.
        });
    });

    // --- Initialization ---
    function initializeBoard() {
        currentBoardId = getBoardIdFromURL();
        if (!currentBoardId) {
            alert('No board specified. Redirecting to home.');
            window.location.href = 'index.html'; // Updated redirect
            return;
        }

        currentBoardData = loadBoardData(currentBoardId);

        if (!currentBoardData) {
            alert(`Board with ID ${currentBoardId} not found. Redirecting to home.`);
            // Optionally, create a new board here if main.js failed or if it's an old link
            // For now, redirect.
            window.location.href = 'index.html'; // Updated redirect
            return;
        }

        // Set board name and page title
        if (boardNameDisplay) boardNameDisplay.textContent = currentBoardData.name;
        document.title = `${currentBoardData.name} - Jules Kanban`;

        loadTasksFromBoardData();
    }

    initializeBoard();
});
