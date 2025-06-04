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
                    tasksByColumn[columnId].push({
                        id: taskElement.id,
                        text: taskElement.textContent
                    });
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
        task.textContent = taskText; // Text content is already sanitized by DOM manipulation

        task.addEventListener('dragstart', handleDragStart);
        task.addEventListener('dragend', handleDragEnd);
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
