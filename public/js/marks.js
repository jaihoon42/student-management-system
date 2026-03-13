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
.then(res => res.json())
.then(data => {
  const select = document.getElementById("studentSelect");
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Student --</option>';
  
  if (Array.isArray(data)) {
    data.forEach(s => {
      const option = document.createElement("option");
      option.value = s._id;
      option.textContent = `${s.name} (${s.rollNumber})`;
      select.appendChild(option);
    });
  } else {
    console.error("Data received is not an array:", data);
  }
})
.catch(err => console.error("Error loading students:", err));

// Add or Update marks
document.getElementById("marksForm").addEventListener("submit", async e => {
  e.preventDefault();
  const student = document.getElementById("studentSelect").value;
  const subject = document.getElementById("subjectInput").value;
  const marks = document.getElementById("marksInput").value;
  const totalMarks = document.getElementById("totalInput").value;
  const editId = document.getElementById("editId").value;

  if (!student) {
      alert("Please select a student");
      return;
  }

  const url = editId ? `/api/marks/${editId}` : "/api/marks";
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ student, subject, marks, totalMarks })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alert(editId ? "Marks updated successfully" : "Marks added successfully");
    resetForm();
    loadMarks();
  } catch (err) {
    alert(err.message);
  }
});

function resetForm() {
  document.getElementById("marksForm").reset();
  document.getElementById("editId").value = "";
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Submit";
    submitBtn.className = "btn btn-primary-modern w-100 btn-modern";
  }
}

// Load marks table
function loadMarks() {
  fetch("/api/marks", { headers: { "Authorization": `Bearer ${token}` } })
  .then(res => res.json())
  .then(data => {
    allRecords = data;
    const tbody = document.querySelector("#marksTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (Array.isArray(data)) {
        data.forEach(m => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${m.student ? m.student.name : 'Unknown'}</td>
            <td>${m.subject}</td>
            <td class="fw-bold text-dark">${m.marks}</td>
            <td class="fw-bold text-dark">${m.totalMarks}</td>
            <td>
              <button class="btn btn-sm btn-info text-white" onclick="editRecord('${m._id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deleteRecord('${m._id}')"><i class="fas fa-trash"></i></button>
            </td>
          `;
          tbody.appendChild(tr);
        });
    }
  });
}

window.editRecord = function(id) {
  const record = allRecords.find(r => r._id === id);
  if (record) {
    document.getElementById("studentSelect").value = record.student ? (record.student._id || record.student) : "";
    document.getElementById("subjectInput").value = record.subject;
    document.getElementById("marksInput").value = record.marks;
    document.getElementById("totalInput").value = record.totalMarks;
    document.getElementById("editId").value = id;
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.textContent = "Update Marks";
        submitBtn.className = "btn btn-success w-100 btn-modern";
    }
  }
};

window.deleteRecord = async function(id) {
  if (!confirm("Are you sure?")) return;
  try {
    const res = await fetch(`/api/marks/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete");
    loadMarks();
  } catch (err) {
    alert(err.message);
  }
};

loadMarks();
