const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Marks = require("../models/Marks");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Fees = require("../models/Fees");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET all students
router.get("/", protect, authorize(["admin"]), async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 }).lean();
    const detailedStudents = await Promise.all(students.map(async (student) => {
        const user = await User.findOne({ studentProfile: student._id }).select("email plainPassword").lean();
        return {
            ...student,
            email: user ? user.email : "No Account",
            password: user ? user.plainPassword : "---"
        };
    }));
    res.json(detailedStudents);
  } catch (err) {
    res.status(500).json({ message: "Failed to load students" });
  }
});

// GET single student
router.get("/:id", protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if(!student) return res.status(404).json({ message: "Student not found" });
    
    const user = await User.findOne({ studentProfile: student._id }).select("email").lean();
    if (user) student.email = user.email;
    
    res.json(student);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CREATE student
router.post("/", protect, authorize(["admin"]), upload.single("photo"), async (req, res) => {
  try {
    const studentData = { ...req.body };
    if (req.file) studentData.photo = `/uploads/${req.file.filename}`;
    const student = await Student.create(studentData);
    res.status(201).json(student);
  } catch(err) { res.status(400).json({ message: err.message }); }
});

// UPDATE student (SYNCHRONIZED WITH USER)
router.put("/:id", protect, authorize(["admin"]), upload.single("photo"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.photo = `/uploads/${req.file.filename}`;
    
    // Update Student model
    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Sync with User model
    const user = await User.findOne({ studentProfile: req.params.id });
    if (user) {
        if (updateData.name) user.name = updateData.name;
        if (updateData.email) user.email = updateData.email;
        if (updateData.password) {
            user.password = updateData.password;
            user.plainPassword = updateData.password;
        }
        await user.save();
    }
    res.json(student);
  } catch(err) { res.status(400).json({ message: err.message }); }
});

// DELETE student
router.delete("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const studentId = req.params.id;
    await Marks.deleteMany({ student: studentId });
    await Attendance.deleteMany({ student: studentId });
    await Fees.deleteMany({ student: studentId });
    await User.findOneAndDelete({ studentProfile: studentId });
    await Student.findByIdAndDelete(studentId);
    res.json({ message: "Permanently deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET Highly Detailed AI Feedback
router.get("/:id/feedback", protect, async (req, res) => {
  try {
    const studentId = req.params.id;
    const marks = await Marks.find({ student: studentId });
    const attendance = await Attendance.find({ student: studentId }).sort({ date: -1 });
    const student = await Student.findById(studentId);
    
    let feedback = [];

    // --- 1. DEEP ATTENDANCE & DISCIPLINE ANALYSIS ---
    if (attendance.length > 0) {
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status.toLowerCase() === 'present').length;
      const lateDays = attendance.filter(a => a.status.toLowerCase() === 'late').length;
      const absentDays = attendance.filter(a => a.status.toLowerCase() === 'absent').length;
      const attendancePercentage = ((presentDays + (lateDays * 0.5)) / totalDays) * 100;

      let attendanceStatus = "";
      if (attendancePercentage >= 95) {
        attendanceStatus = `🌟 PREMIER DISCIPLINE: Your attendance is an elite ${attendancePercentage.toFixed(1)}%. You are among the most consistent students. This level of dedication is a primary indicator of future professional success.`;
      } else if (attendancePercentage >= 80) {
        attendanceStatus = `✅ STRONG ADHERENCE: With ${attendancePercentage.toFixed(1)}% attendance, you demonstrate reliable commitment. Ensuring absences don't cluster together will maintain your academic momentum.`;
      } else if (attendancePercentage >= 75) {
        attendanceStatus = `⚠️ BORDERLINE CONSISTENCY: Your attendance is ${attendancePercentage.toFixed(1)}%. You are currently meeting the 75% requirement, but you have no 'safety margin'. One more week of absences could lead to exam debarment.`;
      } else {
        attendanceStatus = `🚨 CRITICAL ATTENDANCE ALERT: At ${attendancePercentage.toFixed(1)}%, your eligibility for final assessments is in jeopardy. This is significantly impacting your learning curve.`;
      }
      feedback.push(attendanceStatus);

      // Micro-Trend Analysis
      const recent5 = attendance.slice(0, 5);
      const recentAbsents = recent5.filter(a => a.status.toLowerCase() === 'absent').length;
      if (recentAbsents >= 2) {
        feedback.push(`📉 NEGATIVE TREND: In your last 5 scheduled days, you were absent ${recentAbsents} times. This sudden dip suggests a need for immediate intervention.`);
      }
    } else {
      feedback.push("ℹ️ ATTENDANCE SYSTEM: No attendance footprint detected. Data-driven discipline insights will activate once your first 5 sessions are logged.");
    }

    // --- 2. MULTI-DIMENSIONAL ACADEMIC EVALUATION ---
    if (marks.length > 0) {
      let subjectStats = marks.map(m => ({
        subject: m.subject,
        percentage: (m.marks / m.totalMarks) * 100
      }));

      const avgScore = subjectStats.reduce((acc, curr) => acc + curr.percentage, 0) / subjectStats.length;
      feedback.push(`📊 AGGREGATE PERFORMANCE: Your current academic standing across all assessments is ${avgScore.toFixed(1)}%.`);

      const subjects = subjectStats.sort((a, b) => b.percentage - a.percentage);
      const topSubject = subjects[0];
      const bottomSubject = subjects[subjects.length - 1];

      if (topSubject.percentage >= 80) {
        feedback.push(`🔥 INTELLECTUAL DOMINANCE: You are excelling in ${topSubject.subject} (${topSubject.percentage.toFixed(1)}%). This suggests high conceptual clarity in this domain.`);
      }

      if (bottomSubject.percentage < 60) {
        let strategy = "Try active recall and spaced repetition. Summarize each chapter in 3 bullet points after reading.";
        if (bottomSubject.subject.toLowerCase().includes("math")) strategy = "Focus on deriving core formulas and solving 5 extra problems daily.";
        if (bottomSubject.subject.toLowerCase().includes("program")) strategy = "Prioritize hands-on coding and rewrite every class example from scratch.";
        
        feedback.push(`🆘 STRATEGIC INTERVENTION: Your performance in ${bottomSubject.subject} (${bottomSubject.percentage.toFixed(1)}%) requires immediate attention. ACTION PLAN: ${strategy}`);
      }
    } else {
      feedback.push("ℹ️ ACADEMIC SYSTEM: Examination data is pending. Deep subject-specific strategies will be generated upon your first result upload.");
    }

    // --- 3. PERSONALIZED GROWTH ROADMAP ---
    feedback.push(`🎯 PERSONALIZED ROADMAP: 1. Maintain 100% presence for the upcoming week. 2. Dedicate 45 minutes of deep-work daily to your weakest subject. 3. Engage in peer-group discussions for better clarity.`);

    res.json({ feedback });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
