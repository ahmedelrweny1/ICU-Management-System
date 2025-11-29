// Pure MVC - only client-side filtering and UI interactions, no API calls

document.addEventListener('DOMContentLoaded', function() {
    initializeRoomSearch();
    updateRoomFilterCounts();
});

function updateRoomFilterCounts() {
    const rooms = document.querySelectorAll('.room-card');
    const allCount = rooms.length;
    const availableCount = Array.from(rooms).filter(room => 
        room.getAttribute('data-status') === 'Available'
    ).length;
    const occupiedCount = Array.from(rooms).filter(room => 
        room.getAttribute('data-status') === 'Occupied'
    ).length;
    const cleaningCount = Array.from(rooms).filter(room => 
        room.getAttribute('data-status') === 'Cleaning'
    ).length;

    const allCountEl = document.getElementById('allRoomsCount');
    const availableCountEl = document.getElementById('availableCount');
    const occupiedCountEl = document.getElementById('occupiedCount');
    const cleaningCountEl = document.getElementById('cleaningCount');

    if (allCountEl) allCountEl.textContent = allCount;
    if (availableCountEl) availableCountEl.textContent = availableCount;
    if (occupiedCountEl) occupiedCountEl.textContent = occupiedCount;
    if (cleaningCountEl) cleaningCountEl.textContent = cleaningCount;
}

function filterRooms(status, event) {
    event.preventDefault();
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const rooms = document.querySelectorAll('.room-card');
    rooms.forEach(room => {
        if (status === 'all') {
            room.style.display = '';
        } else {
            const roomStatus = room.getAttribute('data-status');
            room.style.display = roomStatus === status ? '' : 'none';
        }
    });
}

function initializeRoomSearch() {
    const searchInput = document.getElementById('roomSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rooms = document.querySelectorAll('.room-card');
        
        rooms.forEach(room => {
            const text = room.textContent.toLowerCase();
            room.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}
