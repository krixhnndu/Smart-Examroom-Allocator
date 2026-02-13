// ================= FILE UPLOAD HANDLING =================
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

// ================= YEAR SELECTION =================
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

// ================= GLOBALS =================
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const allocationTable = document.getElementById('allocation-table');

let currentAllocationData = null;
let examDateFinal = '';
let examDateWithDay = '';
let examTimeFinal = '';

// ================= GENERATE ALLOCATION =================
generateBtn.addEventListener('click', async () => {

    if (!studentsInput.files.length || !classroomsInput.files.length) {
        showError('Please upload both CSV files');
        return;
    }

    if (selectedYears.size === 0) {
        showError('Please select at least one academic year');
        return;
    }

    const datePicker = document.getElementById('exam-date-picker')?.value;
    const manualDate = document.getElementById('exam-date-manual')?.value.trim();
    const startTime = document.getElementById('start-time')?.value;
    const endTime = document.getElementById('end-time')?.value;

    if (manualDate) {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(manualDate)) {
            showError('Enter date in DD/MM/YYYY format');
            return;
        }
        examDateFinal = manualDate;
    } else if (datePicker) {
        examDateFinal = new Date(datePicker).toLocaleDateString('en-GB');
    } else {
        showError('Please select or enter exam date');
        return;
    }

    if (!startTime || !endTime) {
        showError('Please select exam start and end time');
        return;
    }

    if (endTime <= startTime) {
        showError('End time must be after start time');
        return;
    }

    examTimeFinal = `${formatTime(startTime)} - ${formatTime(endTime)}`;

    // ✅ ADD DAY
    const examDay = getDayFromDate(examDateFinal);
    examDateWithDay = `${examDateFinal} (${examDay})`;

    errorMessage.style.display = 'none';
    resultsSection.style.display = 'none';
    loading.style.display = 'block';

    const formData = new FormData();
    formData.append('students_csv', studentsInput.files[0]);
    formData.append('classrooms_csv', classroomsInput.files[0]);
    selectedYears.forEach(year => formData.append('years[]', year));

    try {
        const response = await fetch('/allocate', { method: 'POST', body: formData });
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

// ================= ERROR DISPLAY =================
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => errorMessage.style.display = 'none', 5000);
}

// ================= GROUP BY ROOM =================
function groupByRoom(allocation) {
    const map = {};
    allocation.forEach(r => {
        if (!map[r.room_id]) map[r.room_id] = [];
        map[r.room_id].push(r);
    });
    return map;
}

// ================= DISPLAY RESULTS =================
function displayResults(result) {

    document.getElementById('total-halls').textContent = result.rooms_used;
    document.getElementById('total-students').textContent = result.total_allocated;
    document.getElementById('exam-date').textContent = examDateWithDay;
    document.getElementById('pdf-date').textContent = examDateWithDay;
    document.getElementById('pdf-time').textContent = examTimeFinal;

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Room No.</th>
                    <th>Dept.</th>
                    <th>Roll No.</th>
                    <th>Total No. of Students</th>
                    <th>Left-Handed Chairs Required</th>
                </tr>
            </thead>
            <tbody>
    `;

    const grouped = groupByRoom(result.allocation);

    Object.keys(grouped).forEach(roomId => {
        grouped[roomId].forEach((row, index) => {
            tableHTML += `<tr>`;
            if (index === 0) {
                tableHTML += `<td class="room-cell" rowspan="${grouped[roomId].length}">${roomId}</td>`;
            }
            tableHTML += `
                <td>${row.branch}</td>
                <td>${row.first_roll} to ${row.last_roll}</td>
                <td>${row.total_students}</td>
                <td>${row.left_handed_chairs || ''}</td>
            </tr>`;
        });
    });

    tableHTML += `</tbody></table>`;
    allocationTable.innerHTML = tableHTML;

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// ================= PDF DOWNLOAD =================
document.getElementById('download-pdf-btn').addEventListener('click', () => {
    if (!currentAllocationData) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SCMS SCHOOL OF ENGINEERING AND TECHNOLOGY', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('APJ ABDUL KALAM TECHNOLOGICAL UNIVERSITY', 105, 22, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Internal Examination - Seating Arrangement', 105, 30, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`DATE: ${examDateWithDay}`, 14, 40);
    doc.text(`TIME: ${examTimeFinal}`, 14, 46);
    doc.text(`Total Halls: ${currentAllocationData.rooms_used}`, 120, 40);
    doc.text(`Total Students: ${currentAllocationData.total_allocated}`, 120, 46);

    const tableData = [];
    let lastRoom = null;

    currentAllocationData.allocation.forEach(row => {
        tableData.push([
            row.room_id === lastRoom ? '' : row.room_id,
            row.branch,
            `${row.first_roll} to ${row.last_roll}`,
            row.total_students.toString(),
            row.left_handed_chairs ? row.left_handed_chairs.toString() : ''
        ]);
        lastRoom = row.room_id;
    });

    doc.autoTable({
        head: [['Room No.', 'Dept.', 'Roll No.', 'Total Students', 'Left-Handed Chairs']],
        body: tableData,
        startY: 55,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        headStyles: { fillColor: [102, 126, 234], textColor: 255, halign: 'center' },
        columnStyles: { 0: { halign: 'center' } },

        didDrawCell(data) {
            if (data.column.index === 0 && data.cell.raw === '') {
                doc.setDrawColor(255, 255, 255);
                doc.setLineWidth(1.2);
                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            }
        }
    });

    doc.save(`seating_arrangement_${examDateFinal.replace(/\//g, '-')}.pdf`);
});

// ================= UTIL =================
function formatTime(time24) {
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
}

function getDayFromDate(dateStr) {
    const [dd, mm, yyyy] = dateStr.split('/');
    const dateObj = new Date(`${yyyy}-${mm}-${dd}`);
    return dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
}
