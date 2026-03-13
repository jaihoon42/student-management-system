const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// @desc    Get all attendance records
// @route   GET /api/attendance
router.get("/", protect, authorize(["admin"]), async (req, res) => {
  try {
    const attendance = await Attendance.find({}).populate("student", "name rollNumber class section");
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get attendance for a specific student
// @route   GET /api/attendance/student/:id
router.get("/student/:id", protect, authorize(["admin", "student"]), async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.id });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Add attendance record
// @route   POST /api/attendance
router.post("/", protect, authorize(["admin"]), async (req, res) => {
  const { student, date, status } = req.body;
  try {
    // Prevent duplicate attendance for same student and date
    const existing = await Attendance.findOne({ student, date });
    if (existing) return res.status(400).json({ message: "Attendance already recorded for this date" });

    const attendance = await Attendance.create({ student, date, status });
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update attendance
// @route   PUT /api/attendance/:id
router.put("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
router.delete("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });
    res.json({ message: "Attendance record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
