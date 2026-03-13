const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// REGISTER (Admin OR Self-registration with Password)
router.post("/register", upload.single("photo"), async (req, res) => {
  const { name, email, password, role, rollNumber, class: className, section, dob, registrationPassword } = req.body;
  
  try {
    // 1. Check for Admin token (if provided)
    let isAdmin = false;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.role === 'admin') {
          isAdmin = true;
        }
      } catch (err) {
        // Token invalid, will fallback to registration password check
      }
    }

    // 2. Access Control Check
    const correctRegPass = (process.env.REGISTRATION_PASSWORD || "Systummm").toLowerCase();
    const providedPass = (registrationPassword || "").trim().toLowerCase();
    
    // Flexible check: must match "systum" with at least one "m"
    const pattern = /^systum+$/;
    if (!isAdmin && !pattern.test(providedPass)) {
      return res.status(401).json({ message: "Invalid Registration Password. Use 'Systummm' to register yourself." });
    }

    const userExists = await User.findOne({ email });
    if(userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let studentProfileId = null;

    if (role === "student") {
      if (!rollNumber || !className || !section || !dob) {
        return res.status(400).json({ message: "Missing student details" });
      }

      const studentExists = await Student.findOne({ rollNumber });
      if (studentExists) {
        return res.status(400).json({ message: "Roll number already exists" });
      }

      const studentData = {
        name,
        rollNumber,
        class: className,
        section,
        dob
      };

      if (req.file) {
        studentData.photo = `/uploads/${req.file.filename}`;
      }

      const newStudent = await Student.create(studentData);
      studentProfileId = newStudent._id;
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      plainPassword: password, // Store plain password
      role,
      studentProfile: studentProfileId
    });

    res.status(201).json({ 
      message: "User registered successfully",
      user: { 
        name: user.name, 
        email: user.email, 
        role: user.role,
        studentProfile: user.studentProfile 
      } 
    });
  } catch(err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if(!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { 
      name: user.name, 
      email: user.email, 
      role: user.role,
      studentProfile: user.studentProfile 
    } });
  } catch(err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;
