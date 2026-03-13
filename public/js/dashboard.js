const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) window.location.href = "/login";

// Update header text based on role
const dashboardTitle = document.querySelector(".top-nav h4");
const portalLabel = document.querySelector(".top-nav .text-muted.small");

if (role === "admin") {
    if(dashboardTitle) dashboardTitle.textContent = "Administrative Dashboard";
    if(portalLabel) portalLabel.textContent = "System Administrator";
} else {
    if(dashboardTitle) dashboardTitle.textContent = "Student Dashboard";
    if(portalLabel) portalLabel.textContent = "Student Portal";
}

document.getElementById("userRole").textContent = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

let myChart = null;
let allMarksData = [];

// Show content based on role
if (role === "admin") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");
    loadAdminDashboard();
} else {
    document.querySelectorAll(".student-only").forEach(el => el.style.display = "block");
    const studentId = localStorage.getItem("studentId");
    if (studentId) {
        document.querySelectorAll('a[href="/studentProfile"]').forEach(el => {
            el.href = `/studentProfile?id=${studentId}`;
        });

        // Fetch student photo for avatar
        fetch(`/api/students/${studentId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(student => {
            if (student.photo) {
                document.getElementById("userAvatar").src = student.photo;
            }
            if (student.name) {
                document.querySelector(".text-end.me-3 .fw-bold").textContent = student.name;
            }
        })
        .catch(err => console.error("Error fetching student avatar:", err));
    }
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login";
});

function loadAdminDashboard() {
    // Fetch total students
    fetch("/api/students", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            const totalEl = document.getElementById("totalStudents");
            totalEl.innerHTML = `<a href="/students.html" style="text-decoration: none; color: inherit; cursor: pointer;">${data.length}</a>`;
        }
    })
    .catch(err => console.error("Error fetching students:", err));

    // Fetch total attendance
    fetch("/api/attendance", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            document.getElementById("totalAttendance").textContent = data.length;
        }
    })
    .catch(err => console.error("Error fetching attendance:", err));

    // Fetch total fees collected
    fetch("/api/fees", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            const collected = data.filter(f => f.paid).reduce((sum, f) => sum + f.amount, 0);
            document.getElementById("totalFees").textContent = collected;
        }
    })
    .catch(err => console.error("Error fetching fees:", err));

    // Fetch marks and setup chart
    fetch("/api/marks", { headers: { "Authorization": `Bearer ${token}` } })
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data)) {
            allMarksData = data;
            populateFilters(data);
            updateChart(); // Initial overview
        }
    })
    .catch(err => console.error("Error fetching marks:", err));
}

function populateFilters(data) {
    const studentSelect = document.getElementById("studentFilter");
    const subjectSelect = document.getElementById("subjectFilter");

    // Unique Students
    const studentMap = new Map();
    data.forEach(m => {
        if (m.student && m.student._id) {
            studentMap.set(m.student._id, m.student.name);
        }
    });
    
    studentMap.forEach((name, id) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = name;
        studentSelect.appendChild(opt);
    });

    // Unique Subjects
    const subjects = [...new Set(data.map(m => m.subject))].sort();
    subjects.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subjectSelect.appendChild(opt);
    });

    // Event Listeners
    studentSelect.addEventListener("change", () => {
        if (studentSelect.value) subjectSelect.value = ""; // Clear other filter
        updateChart();
    });

    subjectSelect.addEventListener("change", () => {
        if (subjectSelect.value) studentSelect.value = ""; // Clear other filter
        updateChart();
    });
}

function updateChart() {
    const studentId = document.getElementById("studentFilter").value;
    const subjectName = document.getElementById("subjectFilter").value;
    
    let labels = [];
    let marks = [];
    let chartLabel = "Student Marks Overview";
    let filteredData = [];

    if (studentId) {
        filteredData = allMarksData.filter(m => m.student && m.student._id === studentId);
        labels = filteredData.map(m => m.subject);
        marks = filteredData.map(m => m.marks);
        const studentName = document.querySelector(`#studentFilter option[value="${studentId}"]`).textContent;
        chartLabel = `Performance: ${studentName}`;
    } else if (subjectName) {
        filteredData = allMarksData.filter(m => m.subject === subjectName);
        labels = filteredData.map(m => m.student ? m.student.name : "Unknown");
        marks = filteredData.map(m => m.marks);
        chartLabel = `All Students: ${subjectName}`;
    } else {
        // Default Overview: Show average marks per subject
        const subMap = {};
        allMarksData.forEach(m => {
            if (!subMap[m.subject]) subMap[m.subject] = { total: 0, count: 0 };
            subMap[m.subject].total += m.marks;
            subMap[m.subject].count++;
        });
        labels = Object.keys(subMap);
        marks = labels.map(sub => (subMap[sub].total / subMap[sub].count).toFixed(1));
        chartLabel = "Average Marks per Subject";
    }

    renderChart(labels, marks, chartLabel);
}

function renderChart(labels, marks, chartLabel) {
    const ctx = document.getElementById("marksChart").getContext("2d");
    
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{ 
                label: chartLabel, 
                data: marks, 
                backgroundColor: "rgba(102, 126, 234, 0.7)",
                borderColor: "rgba(102, 126, 234, 1)",
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: "rgba(118, 75, 162, 0.8)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { backgroundColor: '#1e1e2f', padding: 12 }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: { font: { weight: 'bold' } }
                },
                x: { 
                    grid: { display: false },
                    ticks: { font: { weight: 'bold' } }
                }
            }
        }
    });
}
