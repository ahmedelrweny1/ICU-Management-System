// Pure MVC - only client-side UI interactions, no data fetching

function exportScheduleHTML() {
    const scheduleTable = document.querySelector('.schedule-table');
    if (!scheduleTable) {
        alert('Schedule table not found');
        return;
    }
    
    const htmlContent = scheduleTable.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
}
