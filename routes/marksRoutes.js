const express = require("express");
const router = express.Router();
const Marks = require("../models/Marks");
const Attendance = require("../models/Attendance");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// @desc    Get all marks
// @route   GET /api/marks
router.get("/", protect, authorize(["admin"]), async (req, res) => {
  try {
    const marks = await Marks.find({}).populate("student", "name rollNumber class section");
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get marks for a specific student
// @route   GET /api/marks/student/:id
router.get("/student/:id", protect, authorize(["admin", "student"]), async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.params.id });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Add marks for a student
// @route   POST /api/marks
router.post("/", protect, authorize(["admin"]), async (req, res) => {
  const { student, subject, marks, totalMarks } = req.body;
  try {
    const record = await Marks.create({ student, subject, marks, totalMarks });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update marks
// @route   PUT /api/marks/:id
router.put("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const record = await Marks.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ message: "Marks record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Delete marks
// @route   DELETE /api/marks/:id
router.delete("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const record = await Marks.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "Marks record not found" });
    res.json({ message: "Marks record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
