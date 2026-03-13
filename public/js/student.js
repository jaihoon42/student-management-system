const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

// Assume student id is passed via URL query ?id=studentId
const urlParams = new URLSearchParams(window.location.search);
let studentId = urlParams.get("id");

if (!studentId) {
    studentId = localStorage.getItem("studentId");
}

let currentStudentName = "Student";

// Fetch student info
fetch(`/api/students/${studentId}`, { headers: { "Authorization": `Bearer ${token}` } })
.then(res => res.json())
.then(student => {
  currentStudentName = student.name || "Student";
  document.getElementById("studentName").textContent = student.name;
  document.getElementById("studentRoll").textContent = `Roll No: ${student.rollNumber || '---'}`;
  document.getElementById("studentClass").textContent = `Class: ${student.class || '---'}`;
  document.getElementById("studentSection").textContent = `Section: ${student.section || '---'}`;
  
  if(document.getElementById("studentDOB")) {
    document.getElementById("studentDOB").textContent = student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "---";
  }
  
  // Detailed fields
  if(document.getElementById("studentFather")) document.getElementById("studentFather").textContent = student.fatherName || "---";
  if(document.getElementById("studentMother")) document.getElementById("studentMother").textContent = student.motherName || "---";
  if(document.getElementById("studentGender")) document.getElementById("studentGender").textContent = student.gender || "---";
  if(document.getElementById("studentBlood")) document.getElementById("studentBlood").textContent = student.bloodGroup || "---";
  if(document.getElementById("studentEmail")) document.getElementById("studentEmail").textContent = student.email || "---";
  if(document.getElementById("studentPhone")) document.getElementById("studentPhone").textContent = student.phone || "---";
  if(document.getElementById("studentAddress")) document.getElementById("studentAddress").textContent = student.address || "---";

  if (student.photo) {
    document.getElementById("studentPhoto").src = student.photo;
  } else {
    document.getElementById("studentPhoto").src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&size=200`;
  }
})
.catch(err => console.error("Error fetching student info:", err));

// Fetch marks
fetch(`/api/marks/student/${studentId}`, { headers: { "Authorization": `Bearer ${token}` } })
.then(res => res.json())
.then(data => {
  const tbody = document.querySelector("#marksTable tbody");
  if(tbody && Array.isArray(data)) {
    tbody.innerHTML = "";
    if (data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='2' class='text-muted small'>No marks available</td></tr>";
    }
    data.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${m.subject}</td><td>${m.marks}/${m.totalMarks}</td>`;
      tbody.appendChild(tr);
    });
  }
});

// Fetch attendance
fetch(`/api/attendance/student/${studentId}`, { headers: { "Authorization": `Bearer ${token}` } })
.then(res => res.json())
.then(data => {
  const tbody = document.querySelector("#attendanceTable tbody");
  if(tbody && Array.isArray(data)) {
    tbody.innerHTML = "";
    if (data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='2' class='text-muted small'>No records</td></tr>";
    }
    data.slice(0, 10).forEach(a => {
      const tr = document.createElement("tr");
      const statusClass = a.status.toLowerCase() === 'present' ? 'text-success' : (a.status.toLowerCase() === 'absent' ? 'text-danger' : 'text-warning');
      tr.innerHTML = `<td>${new Date(a.date).toLocaleDateString()}</td><td class="${statusClass}">${a.status}</td>`;
      tbody.appendChild(tr);
    });
  }
});

// Fetch feedback
fetch(`/api/students/${studentId}/feedback`, { headers: { "Authorization": `Bearer ${token}` } })
.then(res => res.json())
.then(data => {
  const container = document.getElementById("feedbackList");
  if(container && data.feedback) {
    container.innerHTML = ""; // Clear loader
    data.feedback.forEach(f => {
      const div = document.createElement("div");
      div.className = "feedback-box";
      
      let icon = '<i class="fas fa-info-circle text-info mt-1"></i>';
      let borderClass = "#4f46e5"; // Default indigo

      if (f.includes("🌟") || f.includes("EXCEPTIONAL") || f.includes("Good job") || f.includes("Excellent")) {
          icon = '<i class="fas fa-star text-warning mt-1"></i>';
          borderClass = "#eab308";
      } else if (f.includes("🚨") || f.includes("CRITICAL") || f.includes("🆘")) {
          icon = '<i class="fas fa-exclamation-circle text-danger mt-1"></i>';
          borderClass = "#ef4444";
      } else if (f.includes("⚠️") || f.includes("ATTENTION") || f.includes("📉")) {
          icon = '<i class="fas fa-exclamation-triangle text-warning mt-1"></i>';
          borderClass = "#f59e0b";
      } else if (f.includes("🎯")) {
          icon = '<i class="fas fa-bullseye text-success mt-1"></i>';
          borderClass = "#10b981";
      }

      div.style.borderLeftColor = borderClass;
      div.innerHTML = `
        ${icon}
        <div class="feedback-text">${f}</div>
      `;
      container.appendChild(div);
    });
  }
});

// ID card download
const downloadBtn = document.getElementById("downloadID");
if (downloadBtn) {
    downloadBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/idcard/download/${studentId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error("Server error while generating ID card");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `${currentStudentName.replace(/\s+/g, '_')}_ID_Card.pdf`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            alert(err.message);
        }
    });
}
