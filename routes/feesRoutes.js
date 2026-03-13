const express = require("express");
const router = express.Router();
const Fees = require("../models/Fees");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// @desc    Get all fees records
// @route   GET /api/fees
router.get("/", protect, authorize(["admin"]), async (req, res) => {
  try {
    const fees = await Fees.find({}).populate("student", "name rollNumber class section");
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Get fees records for a specific student
// @route   GET /api/fees/student/:id
router.get("/student/:id", protect, authorize(["admin", "student"]), async (req, res) => {
  try {
    const fees = await Fees.find({ student: req.params.id });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Add fees record
// @route   POST /api/fees
router.post("/", protect, authorize(["admin"]), async (req, res) => {
  const { student, amount, paid } = req.body;
  try {
    const fee = await Fees.create({ student, amount, paid });
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Update fees record
// @route   PUT /api/fees/:id
router.put("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const fee = await Fees.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) return res.status(404).json({ message: "Fees record not found" });
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Delete fees record
// @route   DELETE /api/fees/:id
router.delete("/:id", protect, authorize(["admin"]), async (req, res) => {
  try {
    const fee = await Fees.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fees record not found" });
    res.json({ message: "Fees record deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
