const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== 'admin') {
    window.location.href = "/login.html";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/login.html";
});

let allStudents = [];

// Load Students
async function loadStudents() {
    try {
        const res = await fetch("/api/students", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        allStudents = data;
        renderTable(allStudents);
    } catch (err) {
        console.error("Error loading students:", err);
    }
}

function renderTable(students) {
    const tbody = document.querySelector("#studentTable tbody");
    tbody.innerHTML = "";

    students.forEach(s => {
        const tr = document.createElement("tr");
        const photoUrl = s.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(s.name) + "&background=random";
        
        tr.innerHTML = `
            <td><img src="${photoUrl}" class="rounded-circle" width="40" height="40" style="object-fit: cover;"></td>
            <td>${s.name}</td>
            <td>${s.rollNumber}</td>
            <td>${s.class} - ${s.section}</td>
            <td>${s.email || 'N/A'}</td>
            <td class="text-muted small">${s.password || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-info text-white" onclick="openEditModal('${s._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Search functionality
document.getElementById("studentSearch").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allStudents.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.rollNumber.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// Edit Modal
const editModal = new bootstrap.Modal(document.getElementById('editStudentModal'));

function openEditModal(id) {
    const s = allStudents.find(student => student._id === id);
    if (!s) return;

    document.getElementById("editStudentId").value = s._id;
    document.getElementById("editName").value = s.name;
    document.getElementById("editEmail").value = s.email || "";
    document.getElementById("editRoll").value = s.rollNumber;
    document.getElementById("editClass").value = s.class;
    document.getElementById("editSection").value = s.section;
    document.getElementById("editPassword").value = s.password || "";
    
    // Detailed fields
    document.getElementById("editFather").value = s.fatherName || "";
    document.getElementById("editMother").value = s.motherName || "";
    document.getElementById("editGender").value = s.gender || "Male";
    document.getElementById("editBlood").value = s.bloodGroup || "";
    document.getElementById("editPhone").value = s.phone || "";
    document.getElementById("editAddress").value = s.address || "";
    
    if (s.dob) {
        document.getElementById("editDOB").value = new Date(s.dob).toISOString().split('T')[0];
    } else {
        document.getElementById("editDOB").value = "";
    }
    
    editModal.show();
}

// Update Student
document.getElementById("editStudentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editStudentId").value;
    
    const formData = new FormData();
    formData.append("name", document.getElementById("editName").value);
    formData.append("email", document.getElementById("editEmail").value);
    formData.append("rollNumber", document.getElementById("editRoll").value);
    formData.append("class", document.getElementById("editClass").value);
    formData.append("section", document.getElementById("editSection").value);
    formData.append("password", document.getElementById("editPassword").value);
    
    // New fields
    formData.append("fatherName", document.getElementById("editFather").value);
    formData.append("motherName", document.getElementById("editMother").value);
    formData.append("gender", document.getElementById("editGender").value);
    formData.append("bloodGroup", document.getElementById("editBlood").value);
    formData.append("dob", document.getElementById("editDOB").value);
    formData.append("phone", document.getElementById("editPhone").value);
    formData.append("address", document.getElementById("editAddress").value);
    
    const photoFile = document.getElementById("editPhoto").files[0];
    if (photoFile) {
        formData.append("photo", photoFile);
    }

    try {
        const res = await fetch(`/api/students/${id}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            alert("Student records updated successfully!");
            editModal.hide();
            loadStudents();
        } else {
            const data = await res.json();
            alert(data.message || "Update failed");
        }
    } catch (err) {
        alert("Server error during update");
    }
});

// Delete Student
async function deleteStudent(id) {
    if (!confirm("CRITICAL WARNING: This will permanently delete the student profile, their login account, marks, attendance, and all records. Proceed?")) {
        return;
    }

    try {
        const res = await fetch(`/api/students/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            alert("Student and all associated data deleted permanently.");
            loadStudents();
        } else {
            alert("Deletion failed.");
        }
    } catch (err) {
        alert("Server error");
    }
}

loadStudents();
