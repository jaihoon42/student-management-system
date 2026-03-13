const express = require('express');
const router = express.Router();

// Example analytics data route
router.get('/dashboard', (req, res) => {

    const analytics = {
        totalStudents: 120,
        totalCourses: 8,
        averageAttendance: "88%",
        averageMarks: "76%"
    };

    res.json(analytics);
});

// Attendance analytics
router.get('/attendance', (req, res) => {

    const attendance = [
        { month: "Jan", value: 90 },
        { month: "Feb", value: 85 },
        { month: "Mar", value: 88 },
        { month: "Apr", value: 92 }
    ];

    res.json(attendance);
});

// Marks analytics
router.get('/marks', (req, res) => {

    const marks = [
        { subject: "Math", average: 75 },
        { subject: "Physics", average: 70 },
        { subject: "Chemistry", average: 78 },
        { subject: "Programming", average: 85 }
    ];

    res.json(marks);
});

module.exports = router;
