const token = localStorage.getItem("token");
if (!token) window.location.href = "/login";

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login";
  });
}

let allRecords = [];

// Populate student select
fetch("/api/students", { headers: { "Authorization": `Bearer ${token}` } })
.then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load student list");
    return data;
})
.then(data => {
  const select = document.getElementById("studentSelect");
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Student --</option>';
  
  if (Array.isArray(data) && data.length > 0) {
    data.forEach(s => {
      const option = document.createElement("option");
      option.value = s._id;
      option.textContent = `${s.name} (${s.rollNumber})`;
      select.appendChild(option);
    });
  } else {
    select.innerHTML = '<option value="">No Students Found</option>';
  }
})
.catch(err => {
    console.error("Error loading students:", err);
    alert("CRITICAL ERROR: " + err.message);
});

// Add or Update attendance
document.getElementById("attendanceForm").addEventListener("submit", async e => {
  e.preventDefault();
  const student = document.getElementById("studentSelect").value;
  const date = document.getElementById("dateInput").value;
  const status = document.getElementById("statusSelect").value;
  const editId = document.getElementById("editId").value;

  if (!student) return alert("Please select a student");

  const url = editId ? `/api/attendance/${editId}` : "/api/attendance";
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ student, date, status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alert(editId ? "Attendance updated successfully" : "Attendance added successfully");
    resetForm();
    loadAttendance();
  } catch (err) {
    alert(err.message);
  }
});

function resetForm() {
  document.getElementById("attendanceForm").reset();
  document.getElementById("editId").value = "";
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Save";
    submitBtn.className = "btn btn-primary-modern w-100 btn-modern";
  }
}

// Load attendance table
function loadAttendance() {
  fetch("/api/attendance", { headers: { "Authorization": `Bearer ${token}` } })
  .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load records");
      return data;
  })
  .then(data => {
    allRecords = data;
    const tbody = document.querySelector("#attendanceTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (Array.isArray(data)) {
        data.forEach(a => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${a.student ? a.student.name : 'Unknown'}</td>
            <td>${new Date(a.date).toLocaleDateString()}</td>
            <td><span class="badge ${a.status === 'present' ? 'bg-success' : 'bg-danger'}">${a.status}</span></td>
            <td>
              <button class="btn btn-sm btn-info text-white" onclick="editRecord('${a._id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deleteRecord('${a._id}')"><i class="fas fa-trash"></i></button>
            </td>
          `;
          tbody.appendChild(tr);
        });
    }
  })
  .catch(err => console.error("Load error:", err));
}

window.editRecord = function(id) {
  const record = allRecords.find(r => r._id === id);
  if (record) {
    document.getElementById("studentSelect").value = record.student ? (record.student._id || record.student) : "";
    const date = new Date(record.date).toISOString().split('T')[0];
    document.getElementById("dateInput").value = date;
    document.getElementById("statusSelect").value = record.status;
    document.getElementById("editId").value = id;
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.textContent = "Update Attendance";
        submitBtn.className = "btn btn-success w-100 btn-modern";
    }
  }
};

window.deleteRecord = async function(id) {
  if (!confirm("Are you sure?")) return;
  try {
    const res = await fetch(`/api/attendance/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete");
    loadAttendance();
  } catch (err) {
    alert(err.message);
  }
};

loadAttendance();
