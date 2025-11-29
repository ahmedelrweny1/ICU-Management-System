// Pure MVC - only client-side UI interactions, no data fetching

function exportScheduleHTML() {
    try {
        const scheduleTable = document.querySelector('.schedule-table');
        if (!scheduleTable) {
            showToast('Schedule table not found', 'error');
            return;
        }
        
        // Get week range from the page
        const weekNav = document.querySelector('.week-nav span');
        const weekRange = weekNav ? weekNav.textContent.trim() : new Date().toLocaleDateString();
        
        // Generate proper HTML report with styling
        const htmlContent = generateScheduleReport(scheduleTable, weekRange);
        
        // Create download link
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Staff-Schedule-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Schedule report exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Error exporting schedule: ' + error.message, 'error');
    }
}

function generateScheduleReport(tableElement, weekRange) {
    // Clone the table to avoid modifying the original
    const clonedTable = tableElement.cloneNode(true);
    
    // Remove delete buttons, forms, and action elements from the cloned table
    const deleteButtons = clonedTable.querySelectorAll('form, .btn, button, .btn-outline-danger, .ms-2');
    deleteButtons.forEach(btn => {
        if (btn.parentNode) {
            btn.parentNode.removeChild(btn);
        }
    });
    
    // Remove any remaining form elements
    const forms = clonedTable.querySelectorAll('form');
    forms.forEach(form => {
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    });
    
    // Clean up staff badges - ensure they're visible
    const staffBadges = clonedTable.querySelectorAll('.staff-badge');
    staffBadges.forEach(badge => {
        badge.style.display = 'inline-block';
        badge.style.visibility = 'visible';
        badge.style.opacity = '1';
    });
    
    // Clean up shift-empty elements
    const shiftEmpty = clonedTable.querySelectorAll('.shift-empty');
    shiftEmpty.forEach(el => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
    });
    
    // Clean up shift-assigned containers
    const shiftAssigned = clonedTable.querySelectorAll('.shift-assigned');
    shiftAssigned.forEach(el => {
        el.style.display = 'flex';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        // Remove any buttons inside
        const buttons = el.querySelectorAll('button, form');
        buttons.forEach(btn => {
            if (btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        });
    });
    
    // Ensure all table cells are visible
    const allCells = clonedTable.querySelectorAll('td, th');
    allCells.forEach(cell => {
        cell.style.display = '';
        cell.style.visibility = 'visible';
        cell.style.opacity = '1';
    });
    
    // Get table HTML
    const tableHTML = clonedTable.outerHTML;
    
    // Generate full HTML document with proper styling
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Schedule Report - ${weekRange}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1f2937;
            background: #ffffff;
            padding: 40px 20px;
            line-height: 1.6;
        }
        
        .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4F46E5;
        }
        
        .report-header h1 {
            color: #1f2937;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .report-header .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 12px;
        }
        
        .report-header .date-range {
            color: #4F46E5;
            font-size: 18px;
            font-weight: 600;
        }
        
        .report-meta {
            text-align: center;
            margin-bottom: 30px;
            color: #6b7280;
            font-size: 14px;
        }
        
        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .schedule-table thead {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: #ffffff;
        }
        
        .schedule-table th {
            padding: 16px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .schedule-table th:last-child {
            border-right: none;
        }
        
        .schedule-table th small {
            display: block;
            font-size: 11px;
            font-weight: 400;
            opacity: 0.9;
            margin-top: 4px;
        }
        
        .schedule-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s;
        }
        
        .schedule-table tbody tr:last-child {
            border-bottom: none;
        }
        
        .schedule-table tbody tr:hover {
            background-color: #f9fafb;
        }
        
        .schedule-table td {
            padding: 16px 12px;
            vertical-align: top;
            font-size: 14px;
        }
        
        .schedule-table td:first-child {
            font-weight: 600;
            color: #1f2937;
            background-color: #f9fafb;
            width: 150px;
        }
        
        .schedule-table td:first-child small {
            display: block;
            font-weight: 400;
            color: #6b7280;
            font-size: 12px;
            margin-top: 4px;
        }
        
        .shift-assigned {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
        }
        
        .staff-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #4F46E5;
            color: #ffffff;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
        }
        
        .shift-empty {
            color: #9ca3af;
            font-style: italic;
            font-size: 13px;
        }
        
        .shift-empty i {
            margin-right: 4px;
        }
        
        .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .schedule-table {
                box-shadow: none;
            }
            
            .schedule-table thead {
                background: #4F46E5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .staff-badge {
                background: #4F46E5 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1>Staff Schedule Report</h1>
        <div class="subtitle">Shefaa ICU Management System</div>
        <div class="date-range">${weekRange}</div>
    </div>
    
    <div class="report-meta">
        Generated on ${new Date().toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
    </div>
    
    <div style="overflow-x: auto;">
        ${tableHTML}
    </div>
    
    <div class="report-footer">
        <p>This report was automatically generated by the Shefaa ICU Management System.</p>
        <p>&copy; ${new Date().getFullYear()} Shefaa ICU. All rights reserved.</p>
    </div>
</body>
</html>`;
    
    return html;
}

// PDF Export function
async function exportSchedulePDF() {
    try {
        const scheduleTable = document.querySelector('.schedule-table');
        if (!scheduleTable) {
            showToast('Schedule table not found', 'error');
            return;
        }
        
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            showToast('PDF library not loaded. Please refresh the page.', 'error');
            return;
        }
        
        showToast('Generating PDF...', 'info');
        
        // Get week range
        const weekNav = document.querySelector('.week-nav span');
        const weekRange = weekNav ? weekNav.textContent.trim() : new Date().toLocaleDateString();
        
        // Generate HTML report
        const htmlContent = generateScheduleReport(scheduleTable, weekRange);
        
        // Create temporary element for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.id = 'schedule-pdf-temp';
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '0px';
        tempDiv.style.left = '0px';
        tempDiv.style.width = '794px';
        tempDiv.style.padding = '20px';
        tempDiv.style.backgroundColor = '#FFFFFF';
        tempDiv.style.zIndex = '99999';
        tempDiv.style.visibility = 'visible';
        tempDiv.style.opacity = '1';
        document.body.appendChild(tempDiv);
        
        // Generate PDF
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Staff-Schedule-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                backgroundColor: '#FFFFFF',
                width: 794,
                height: tempDiv.scrollHeight
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'landscape',
                compress: true
            },
            pagebreak: { 
                mode: ['avoid-all', 'css', 'legacy']
            }
        };
        
        const pdf = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');
        
        // Create download link
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Staff-Schedule-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Remove temporary element
        setTimeout(() => {
            if (tempDiv.parentNode) {
                tempDiv.parentNode.removeChild(tempDiv);
            }
        }, 1000);
        
        showToast('PDF report exported successfully!', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showToast('Error exporting PDF: ' + error.message, 'error');
    }
}
