// File upload handling
const studentsInput = document.getElementById('students-csv');
const classroomsInput = document.getElementById('classrooms-csv');
const studentsFileName = document.getElementById('students-file-name');
const classroomsFileName = document.getElementById('classrooms-file-name');

studentsInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        studentsFileName.textContent = e.target.files[0].name;
    }
});

classroomsInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        classroomsFileName.textContent = e.target.files[0].name;
    }
});

// Year selection handling
const yearButtons = document.querySelectorAll('.year-btn');
const selectedYears = new Set();

yearButtons.forEach(button => {
    button.addEventListener('click', () => {
        const year = button.dataset.year;
        
        if (selectedYears.has(year)) {
            selectedYears.delete(year);
            button.classList.remove('active');
        } else {
            selectedYears.add(year);
            button.classList.add('active');
        }
    });
});

// Generate allocation
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const allocationTable = document.getElementById('allocation-table');

let currentAllocationData = null;

generateBtn.addEventListener('click', async () => {
    // Validate inputs
    if (!studentsInput.files.length || !classroomsInput.files.length) {
        showError('Please upload both CSV files');
        return;
    }
    
    if (selectedYears.size === 0) {
        showError('Please select at least one academic year');
        return;
    }
    
    // Hide previous results and errors
    errorMessage.style.display = 'none';
    resultsSection.style.display = 'none';
    loading.style.display = 'block';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('students_csv', studentsInput.files[0]);
    formData.append('classrooms_csv', classroomsInput.files[0]);
    
    selectedYears.forEach(year => {
        formData.append('years[]', year);
    });
    
    try {
        const response = await fetch('/allocate', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        loading.style.display = 'none';
        
        if (result.success) {
            currentAllocationData = result;
            displayResults(result);
        } else {
            showError(result.error);
        }
    } catch (error) {
        loading.style.display = 'none';
        showError('An error occurred: ' + error.message);
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function displayResults(result) {
    // Update stats
    document.getElementById('total-halls').textContent = result.rooms_used;
    document.getElementById('total-students').textContent = result.total_allocated;
    
    // Set current date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    document.getElementById('exam-date').textContent = dateStr;
    
    // Build table HTML matching reference format
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Room No.</th>
                    <th>Dept./Subj.</th>
                    <th>Roll No.</th>
                    <th>Total No. of Students</th>
                    <th>Left-Handed Chairs Required</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    result.allocation.forEach(room => {
        const leftHandedDisplay = room.left_handed_chairs ? room.left_handed_chairs : '';
        
        tableHTML += `
            <tr>
                <td class="room-cell">${room.room_id}</td>
                <td class="branch-cell">${room.branch}</td>
                <td class="roll-cell">${room.first_roll} to ${room.last_roll}</td>
                <td class="count-cell">${room.total_students}</td>
                <td class="left-handed-cell">${leftHandedDisplay}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    allocationTable.innerHTML = tableHTML;
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// PDF download using jsPDF
const downloadPdfBtn = document.getElementById('download-pdf-btn');

downloadPdfBtn.addEventListener('click', () => {
    if (!currentAllocationData) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SCMS SCHOOL OF ENGINEERING AND TECHNOLOGY', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('APJ ABDUL KALAM TECHNOLOGICAL UNIVERSITY', 105, 22, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Internal Examination - Seating Arrangement', 105, 30, { align: 'center' });
    
    // Date and info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    doc.text(`DATE: ${dateStr}`, 14, 40);
    doc.text(`Total Halls: ${currentAllocationData.rooms_used}`, 14, 46);
    doc.text(`Total Appearing Students: ${currentAllocationData.total_allocated}`, 120, 40);
    
    // Prepare table data
    const tableData = currentAllocationData.allocation.map(room => [
        room.room_id,
        room.branch,
        `${room.first_roll} to ${room.last_roll}`,
        room.total_students.toString(),
        room.left_handed_chairs ? room.left_handed_chairs.toString() : ''
    ]);
    
    // Add table
    doc.autoTable({
        head: [['Room No.', 'Dept./Subj.', 'Roll No.', 'Total Students', 'Left-Handed Chairs']],
        body: tableData,
        startY: 52,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [248, 249, 255]
        }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY || 52;
    doc.setFontSize(8);
    doc.text('NB: Students are advised to note the Exam Hall numbers', 14, finalY + 10);
    doc.text('as they are liable to change for each session.', 14, finalY + 15);
    
    // Save PDF
    doc.save(`seating_arrangement_${dateStr.replace(/\//g, '-')}.pdf`);
});
