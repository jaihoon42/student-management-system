const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { generateIDCardStream } = require('../utils/idCardGenerator');
const { protect } = require('../middleware/authMiddleware');

// Generate student ID card data (JSON)
router.get('/:studentId', protect, async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route to download ID card PDF
router.get('/download/:studentId', protect, async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) return res.status(404).json({ message: "Student not found" });

        // Set headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${student.name}_ID_Card.pdf"`);

        // Generate and stream directly to response
        generateIDCardStream(student, res);

    } catch (err) {
        console.error("ID Card Generation Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate ID card" });
        }
    }
});

module.exports = router;
