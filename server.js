require("dotenv").config();

const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ['html', 'htm']
}));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/marks", require("./routes/marksRoutes"));
app.use("/api/fees", require("./routes/feesRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/idcard", require("./routes/idCardRoutes"));

// Default route
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/attendance", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "attendance.html"));
});

app.get("/marks", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "marks.html"));
});

app.get("/fees", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "fees.html"));
});

app.get("/studentProfile", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "studentProfile.html"));
});

// Connect Database and Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    // Sync indexes
    const User = require("./models/User");
    await User.syncIndexes();
    console.log("Database indexes synchronized");
    
    // Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
