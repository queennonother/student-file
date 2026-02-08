// document.createElement(
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search');
const classFilter = document.getElementById('classFilter');
const totalEl = document.getElementById('total');
const avgAttendanceEl = document.getElementById('avgAttendance');
const topMathsEl = document.getElementById('topMaths');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');


//---------csv parser--------
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines.shift().split(',').map(h => h.trim());
    return lines.map(line => {
        const cols = line.split(',').map(c => c.trim());
        const obj = {};
        headers.forEach((h, i) => obj[h] = cols[i] ?? '')
        return obj;
    });
}

//-----------------App State-------------

let students = [];
let filtered = [];
let sortkey = null;
let sortdior = 1;// 1 asc, -1 desc
//---------Load CSV---------
async function loadData() {
    try {
        const res = await fetch('Data/students.csv');
        if (!res.ok) throw new Error('student.csv not found. put it in data/students.csv');
        const text = await res.text();
        students = parseCSV(text).map(s => ({
            'Student ID': s['Student ID'] || s['ID'] || '',
            'Name': s['Name'] || '',
            'class': s['class'] || '',
            'Maths': Number(s['Maths'] || 0),
            'English': Number(s['English'] || 0),
            'Science': Number(s['Science'] || 0),
            'Attendence (%)': Number(s['Attendence (%),'] || s['Attendence'] || 0)
        }));
        populateClassFilter();
        applyFilters();
    } catch (err) {
        tableBody.innerHTML = '<tr><td colspan="7" class="small">Error loading data :' + err.message + '</td></tr>';
        console.error(err);
    }
}

//------ populate class filter options------
function populateClassFilter() {
    const classes = Array.from(new Set(students.map(s => s['Class ']).filter(Boolean))).sort();
    classes.forEach(c => {
        const opt = document.createElement('option'); opt.value = c; opt.textContent = c; classFilter.appendChild(opt);
    });
}

//--------- Render table ---------
function renderTable(list) {
    if (list.length === 0) {
        tableBody.innerHTML = 'etrastd colspan="7" class="small"›No students found.</td></tr»';
        return;
    }
    tableBody.innerHTML = list.map(s => {
        return `<tr>

<td>/${s['Student ID']}</td>
<td>/${s['Name']}</td>
<td>/${s['Class']}</td>
<td>/${s['Maths']}</td>
<td>/${s['English']}</td>
<td>/${s['Science']}</td>
<td>/${s['Attendance (%)']}</td>
</tr>`;
    }).join('');
}


//--------- compute stats---------
function computeStats(list) {
    totalEl.textContent = list.length;
    const avgAtt = list.length ? (list.reduce((a, b) => + (Number(b['Attendance (%)']) || 0), 0) / list.length) : 0;
    avgAttendanceEl.textContent = Math.round(avgAtt * 10) / 10 + '%';
    const top = list.slice().sort((a, b) => b['Maths'] - a['Maths'])[0];
    topMathsEl.textContent = top ? `${top['Name']} (${top['Maths']})` : '-';

}


//--------- Apply filters, search and sort---------
function applyFilters() {
    const q = searchInput.value.toLowerCase();
    const cls = classFilter.value;
    filtered = students.filter(s => {
        const matchsearch = q === '' || (s['Name'] || '').toLowerCase().includes(q) || (s['Student ID'] || '').toLowerCase().includes(q);
        const matchClass = !cls || s['Class'] === cls;
        return matchsearch && matchClass;
    });

    if (sortkey) {
        filtered.sort((a, b) => {
            if (typeof a[sortkey] === 'number' && typeof vb === 'number') return (va - vb) * sortdior;
            return String(va).localeCompare(String(vb)) * sortdior;

        });
    }

    renderTable(filtered);
    computeStats(filtered)
}

//--------- Event Listeners---------
searchInput.addEventListener('input', () => applyFilters());
classFilter.addEventListener('change', () => applyFilters());
resetBtn.addEventListener('click', () => {
    searchInput.value = ''; classFilter.value = ''; sortkey = null; sortDir = 1; applyFilters();

});

// Sort by clocking headers
document.querySelectorAll('thead th.clickable').forEach(th => {
    th.addEventListener('click', () => {
        const key = th.getAttribute('datakey');
        if (sortkey === key) sortDir *= -1; else { sortkey = key; sortDir = 1; }
        // add small UI cue
        document.querySelectorAll('thead th').forEach(h => h.textContent = h.getAttribute('data-key') + '');
        th.textContent = key + (sortDir === 1 ? ' ▲' : ' ▼');
        applyFilters();
    });
});

//--------- Eport visible rows to CSV---------
function toCSV(rows) {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    for (const r of rows) {
        lines.push(headers.map(h => String(r[h]).replace(/\r?\n/g, ' ').replace(/,/g, ' ')).join(','));
    }
    return lines.join('\n');
}
exportBtn.addEventListener('click', () => {
    const csv = toCSV(filtered.length ? filtered : students);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.dowmload = 'students_export.csv'; document.body.appendChild(a); a.remove(); URL.revokeObjectURL(url);
});

//--------- Init---------
loadData();

