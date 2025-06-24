document.addEventListener('DOMContentLoaded', () => {
    const createBoardBtn = document.getElementById('create-board-btn');
    const boardsContainer = document.getElementById('boards-container');
    const themeSwitch = document.getElementById('theme-switch-checkbox'); // Already handled by inline script in main.html

    const KANBAN_BOARDS_LIST_KEY = 'julesKanbanBoardsList'; // Stores array of {id, name}
    const KANBAN_BOARD_DATA_PREFIX = 'julesKanbanBoard_'; // Prefix for individual board data

    function getBoardsList() {
        const list = localStorage.getItem(KANBAN_BOARDS_LIST_KEY);
        return list ? JSON.parse(list) : [];
    }

    function saveBoardsList(list) {
        localStorage.setItem(KANBAN_BOARDS_LIST_KEY, JSON.stringify(list));
    }

    function generateBoardId() {
        return `board-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }

    function displayBoards() {
        boardsContainer.innerHTML = ''; // Clear existing cards
        const boards = getBoardsList();

        if (boards.length === 0) {
            const noBoardsMessage = document.createElement('p');
            noBoardsMessage.textContent = 'No boards yet. Create one to get started!';
            noBoardsMessage.style.textAlign = 'center';
            noBoardsMessage.style.gridColumn = '1 / -1'; // Span all columns if grid is active
            boardsContainer.appendChild(noBoardsMessage);
            return;
        }

        boards.forEach(board => {
            const boardCard = document.createElement('a');
            boardCard.href = `board.html?boardId=${board.id}`;
            boardCard.classList.add('board-card');
            boardCard.textContent = board.name;
            boardsContainer.appendChild(boardCard);
        });
    }

    createBoardBtn.addEventListener('click', () => {
        const boardName = prompt('Enter a name for your new Kanban board:');
        if (boardName && boardName.trim() !== '') {
            const newBoardId = generateBoardId();
            const boards = getBoardsList();
            boards.push({ id: newBoardId, name: boardName.trim() });
            saveBoardsList(boards);

            // Initialize data for the new board (e.g., empty columns)
            // This ensures that when the board page loads, it has a basic structure.
            const initialBoardData = {
                id: newBoardId,
                name: boardName.trim(),
                columns: {
                    todo: [],
                    inprogress: [],
                    done: []
                }
            };
            localStorage.setItem(`${KANBAN_BOARD_DATA_PREFIX}${newBoardId}`, JSON.stringify(initialBoardData));

            // Navigate to the new board
            window.location.href = `board.html?boardId=${newBoardId}`;
        } else if (boardName !== null) { // User didn't cancel but entered empty name
            alert('Board name cannot be empty.');
        }
    });

    // Initial display of boards
    displayBoards();

    // Theme switcher logic is already in main.html's inline script.
    // If we want to move it here, we'd replicate the logic from script.js:
    // const bodyElement = document.body;
    // function applyTheme(isLightMode) { ... } etc.
    // For now, keeping it separate as per main.html's current structure.
});
