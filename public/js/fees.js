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

// Add or Update fees
document.getElementById("feesForm").addEventListener("submit", async e => {
  e.preventDefault();
  const student = document.getElementById("studentSelect").value;
  const amount = document.getElementById("amountInput").value;
  const paid = document.getElementById("paidSelect").value === "true";
  const editId = document.getElementById("editId").value;

  if (!student) {
      alert("Please select a student");
      return;
  }

  const url = editId ? `/api/fees/${editId}` : "/api/fees";
  const method = editId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ student, amount, paid })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    alert(editId ? "Fees updated successfully" : "Fees added successfully");
    resetForm();
    loadFees();
  } catch (err) {
    alert(err.message);
  }
});

function resetForm() {
  document.getElementById("feesForm").reset();
  document.getElementById("editId").value = "";
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.textContent = "Update";
    submitBtn.className = "btn btn-primary-modern w-100 btn-modern";
  }
}

// Load fees table
function loadFees() {
  fetch("/api/fees", { headers: { "Authorization": `Bearer ${token}` } })
  .then(res => res.json())
  .then(data => {
    allRecords = data;
    const tbody = document.querySelector("#feesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (Array.isArray(data)) {
        data.forEach(f => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${f.student ? f.student.name : 'Unknown'}</td>
            <td>₹ ${f.amount}</td>
            <td><span class="badge ${f.paid ? 'bg-success' : 'bg-warning'}">${f.paid ? "Paid" : "Pending"}</span></td>
            <td>${new Date(f.date).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-info text-white" onclick="editRecord('${f._id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deleteRecord('${f._id}')"><i class="fas fa-trash"></i></button>
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
    document.getElementById("amountInput").value = record.amount;
    document.getElementById("paidSelect").value = record.paid.toString();
    document.getElementById("editId").value = id;
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.textContent = "Save Changes";
        submitBtn.className = "btn btn-success w-100 btn-modern";
    }
  }
};

window.deleteRecord = async function(id) {
  if (!confirm("Are you sure?")) return;
  try {
    const res = await fetch(`/api/fees/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete");
    loadFees();
  } catch (err) {
    alert(err.message);
  }
};

loadFees();
