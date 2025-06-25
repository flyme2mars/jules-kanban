document.addEventListener('DOMContentLoaded', () => {
    const createBoardBtn = document.getElementById('create-board-btn');
    const boardsContainer = document.getElementById('boards-container');
    // const themeSwitch = document.getElementById('theme-switch-checkbox'); // Handled by inline script

    // Modal elements
    const newBoardModal = document.getElementById('new-board-modal');
    const newBoardNameInput = document.getElementById('new-board-name-input');
    const confirmCreateBoardBtn = document.getElementById('confirm-create-board-btn');
    const cancelCreateBoardBtn = document.getElementById('cancel-create-board-btn');

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

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('board-card-icon');
            iconSpan.innerHTML = '&#128194;'; // Folder icon 📂
            boardCard.appendChild(iconSpan);

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('board-card-name');
            nameSpan.textContent = board.name;
            boardCard.appendChild(nameSpan);

            boardsContainer.appendChild(boardCard);
        });
    }

    function showNewBoardModal() {
        if (!newBoardModal) return;
        newBoardNameInput.value = ''; // Clear previous input
        newBoardModal.classList.add('active');
        newBoardNameInput.focus();
    }

    function hideNewBoardModal() {
        if (!newBoardModal) return;
        newBoardModal.classList.remove('active');
    }

    function handleCreateBoard() {
        const boardName = newBoardNameInput.value.trim();
        if (boardName === '') {
            alert('Board name cannot be empty.');
            newBoardNameInput.focus();
            return;
        }

        const newBoardId = generateBoardId();
        const boards = getBoardsList();
        boards.push({ id: newBoardId, name: boardName });
        saveBoardsList(boards);

        const initialBoardData = {
            id: newBoardId,
            name: boardName,
            columns: {
                todo: [],
                inprogress: [],
                done: []
            }
        };
        localStorage.setItem(`${KANBAN_BOARD_DATA_PREFIX}${newBoardId}`, JSON.stringify(initialBoardData));

        hideNewBoardModal();
        displayBoards(); // Refresh the list on the current page
        window.location.href = `board.html?boardId=${newBoardId}`; // Navigate to new board
    }


    if (createBoardBtn) {
        createBoardBtn.addEventListener('click', showNewBoardModal);
    }

    if (confirmCreateBoardBtn) {
        confirmCreateBoardBtn.addEventListener('click', handleCreateBoard);
    }

    if (newBoardNameInput) {
        newBoardNameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                handleCreateBoard();
            }
        });
    }

    if (cancelCreateBoardBtn) {
        cancelCreateBoardBtn.addEventListener('click', hideNewBoardModal);
    }

    // Close modal if clicking on the overlay
    if (newBoardModal) {
        newBoardModal.addEventListener('click', (event) => {
            if (event.target === newBoardModal) { // Clicked on the overlay itself
                hideNewBoardModal();
            }
        });
    }

    // Initial display of boards
    displayBoards();

    // Theme switcher logic is already in main.html's inline script.
    // If we want to move it here, we'd replicate the logic from script.js:
    // const bodyElement = document.body;
    // function applyTheme(isLightMode) { ... } etc.
    // For now, keeping it separate as per main.html's current structure.
});
