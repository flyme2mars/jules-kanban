document.addEventListener('DOMContentLoaded', () => {
    const addTaskButtons = document.querySelectorAll('.add-task-btn');
    const taskInputs = document.querySelectorAll('.new-task-input');
    const columnsTasksContainers = document.querySelectorAll('.column .tasks');
    const columns = document.querySelectorAll('.column');

    let draggedTask = null;

    function generateId() {
        return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    function saveTasks() {
        try {
            const tasksByColumn = {};
            columns.forEach(column => {
                const columnId = column.id;
                const tasksInColumn = column.querySelectorAll('.tasks .task');
                tasksByColumn[columnId] = [];
                tasksInColumn.forEach(taskElement => {
                    const textSpan = taskElement.querySelector('.task-text-content');
                    if (textSpan) {
                        tasksByColumn[columnId].push({
                            id: taskElement.id,
                            text: textSpan.textContent.trim()
                        });
                    } else {
                        // Fallback or error handling if the structure is not as expected
                        // This might happen if old tasks without the span are somehow still in localStorage
                        // or if there's a bug in createTaskElement.
                        // For now, we'll try to grab the whole textContent and hope for the best,
                        // but ideally, this case should be handled more gracefully or logged.
                        console.warn(`Task element with ID ${taskElement.id} is missing 'task-text-content' span. Attempting fallback text extraction.`);
                        tasksByColumn[columnId].push({
                            id: taskElement.id,
                            text: taskElement.textContent.replace(/X$/, '').trim() // Try to remove trailing X
                        });
                    }
                });
            });
            localStorage.setItem('kanbanData', JSON.stringify(tasksByColumn));
            // console.log('Tasks saved:', tasksByColumn); // Optional: for debugging
        } catch (error) {
            console.error('Error saving tasks to local storage:', error);
            // Optionally, inform the user: alert('Could not save tasks. Local storage might be full or disabled.');
        }
    }

    function loadTasks() {
        try {
            const savedData = localStorage.getItem('kanbanData');
            if (savedData) {
                const tasksByColumn = JSON.parse(savedData);
                // console.log('Tasks loaded:', tasksByColumn); // Optional: for debugging
                for (const columnId in tasksByColumn) {
                    const columnElement = document.getElementById(columnId);
                    if (columnElement) {
                        const tasksContainer = columnElement.querySelector('.tasks');
                        // Clear existing tasks in the column before loading (important for multiple loads or refreshes)
                        // This is generally not needed if loadTasks is only called once on DOMContentLoaded
                        // and the containers are initially empty. However, if tasks were ever added by JS
                        // before this load, this would prevent duplication.
                        // tasksContainer.innerHTML = '';
                        tasksByColumn[columnId].forEach(taskData => {
                            // Basic validation: ensure taskData and its properties exist
                            if (taskData && typeof taskData.text === 'string' && typeof taskData.id === 'string') {
                                const taskElement = createTaskElement(taskData.text, taskData.id);
                                tasksContainer.appendChild(taskElement);
                            } else {
                                console.warn('Skipping invalid task data during load:', taskData);
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading tasks from local storage:', error);
            // Optionally, inform the user: alert('Could not load tasks. Data might be corrupted.');
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

        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('delete-task-btn');
        deleteBtn.textContent = 'X';
        deleteBtn.addEventListener('click', () => {
            task.remove();
            saveTasks();
        });

        task.appendChild(deleteBtn);

        task.addEventListener('dragstart', handleDragStart);
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
            const tasksContainer = columnsTasksContainers[index];
            const taskText = inputField.value.trim();

            if (taskText === '') {
                // Optionally, provide user feedback e.g., by shaking the input or showing a small message
                // For now, we just prevent adding an empty task.
                console.warn('Attempted to add an empty task.');
                inputField.focus(); // Refocus the input
                return;
            }

            const newTask = createTaskElement(taskText);
            tasksContainer.appendChild(newTask);
            inputField.value = '';
            saveTasks();
        });
    });

    taskInputs.forEach((inputField, index) => {
        inputField.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent default form submission or line break
                addTaskButtons[index].click(); // Trigger click on corresponding add button
            }
        });
    });

    function handleDragStart(e) {
        draggedTask = e.target;
        // Basic check: Ensure it's a task being dragged
        if (!draggedTask.classList.contains('task')) {
            e.preventDefault(); // Prevent drag if it's not a task element
            return;
        }
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd(e) {
        if (draggedTask && draggedTask.classList.contains('task')) { // Check if draggedTask is valid
            draggedTask.classList.remove('dragging');
        }
        draggedTask = null;
        columns.forEach(column => column.classList.remove('drag-over'));
        saveTasks();
    }

    // Touch event handlers
    let initialTouchX = 0;
    let initialTouchY = 0;

    function handleTouchStart(e) {
        // Prevent default only if the target is the task itself, not an interactive element within
        if (e.target.classList.contains('task')) {
            // e.preventDefault(); // Be cautious with this, might prevent text selection or other interactions if tasks become more complex
        }
        draggedTask = e.target;
        if (!draggedTask.classList || !draggedTask.classList.contains('task')) {
            draggedTask = null; // Ensure we only drag tasks
            return;
        }

        draggedTask.classList.add('dragging');

        const touch = e.touches[0];
        initialTouchX = touch.clientX;
        initialTouchY = touch.clientY;

        // Store initial touch coordinates on the element for potential use in handleTouchMove
        // This can be useful if you need to calculate deltas or for more complex interactions.
        draggedTask.dataset.initialTouchX = touch.clientX;
        draggedTask.dataset.initialTouchY = touch.clientY;
    }

    function handleTouchMove(e) {
        if (!draggedTask) return;

        e.preventDefault(); // Crucial to prevent scrolling while dragging

        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;

        // Optional: Make the task follow the touch position visually.
        // This is more complex as it requires changing task's position style (e.g., transform: translate)
        // and then correctly placing it in the new column on touchend.
        // For this implementation, we'll focus on determining the column and reordering.

        // Determine the element under the touch point
        let elementUnderTouch = document.elementFromPoint(currentX, currentY);
        let targetColumn = null;

        // Find the closest parent .column
        while (elementUnderTouch) {
            if (elementUnderTouch.classList && elementUnderTouch.classList.contains('column')) {
                targetColumn = elementUnderTouch;
                break;
            }
            elementUnderTouch = elementUnderTouch.parentElement;
        }

        columns.forEach(col => col.classList.remove('drag-over')); // Remove from all first

        if (targetColumn) {
            targetColumn.classList.add('drag-over');
            const tasksContainer = targetColumn.querySelector('.tasks');
            if (tasksContainer) {
                const tasksInColumn = [...tasksContainer.querySelectorAll('.task:not(.dragging)')];
                let nextTaskElement = null;

                for (const task of tasksInColumn) {
                    const rect = task.getBoundingClientRect();
                    if (currentY < rect.top + rect.height / 2) {
                        nextTaskElement = task;
                        break;
                    }
                }
                // Append or insert draggedTask into the target column's task container
                if (nextTaskElement) {
                    tasksContainer.insertBefore(draggedTask, nextTaskElement);
                } else {
                    tasksContainer.appendChild(draggedTask);
                }
            }
        }
    }

    function handleTouchEnd(e) {
        if (draggedTask) {
            draggedTask.classList.remove('dragging');
            // Clean up dataset properties if they were used
            delete draggedTask.dataset.initialTouchX;
            delete draggedTask.dataset.initialTouchY;
        }

        columns.forEach(column => column.classList.remove('drag-over'));

        saveTasks(); // Save changes after drag operation
        draggedTask = null;
        initialTouchX = 0; // Reset initial touch coordinates
        initialTouchY = 0;
    }

    columns.forEach(column => {
        const tasksContainer = column.querySelector('.tasks');

        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedTask) { // Only add class if a task is being dragged
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
                if (tasksContainer === draggedTask.parentNode) {
                    if (nextTask) {
                        tasksContainer.insertBefore(draggedTask, nextTask);
                    } else {
                        tasksContainer.appendChild(draggedTask);
                    }
                }
            }
        });

        column.addEventListener('dragleave', (e) => {
            if (!column.contains(e.relatedTarget) || e.relatedTarget === column || !draggedTask) {
                 column.classList.remove('drag-over');
            }
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            if (draggedTask && tasksContainer) {
                 // Check if the dragged task is not already in the target container at the exact same position
                let shouldAppend = true;
                if (tasksContainer === draggedTask.parentNode) {
                    // If it's the same column, dragover should handle reordering.
                    // This check prevents re-appending if drop happens without significant movement.
                    const currentTasks = Array.from(tasksContainer.children);
                    const draggedIndex = currentTasks.indexOf(draggedTask);
                    // Simplified: if it's already in this container, assume dragover handled it.
                    // More complex logic could check if its position actually needs to change.
                    shouldAppend = false;
                }


                if (shouldAppend) {
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
                    if (nextTask) {
                        tasksContainer.insertBefore(draggedTask, nextTask);
                    } else {
                        tasksContainer.appendChild(draggedTask);
                    }
                }
                // saveTasks() is in handleDragEnd
            }
        });
    });

    loadTasks();
});
