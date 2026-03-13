const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Save token and redirect to dashboard
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    if (data.user.studentProfile) {
      localStorage.setItem("studentId", data.user.studentProfile);
    }
    window.location.href = "/dashboard";

  } catch (err) {
    errorMsg.textContent = err.message;
  }
});
