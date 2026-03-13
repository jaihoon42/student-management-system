const generateFeedback = (marksRecords, attendanceRecords) => {
  const feedback = [];

  // Marks feedback
  marksRecords.forEach(m => {
    if (m.marks / m.totalMarks >= 0.9) feedback.push(`${m.subject}: Excellent performance!`);
    else if (m.marks / m.totalMarks >= 0.75) feedback.push(`${m.subject}: Good, can improve.`);
    else feedback.push(`${m.subject}: Needs improvement!`);
  });

  // Attendance feedback
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter(a => a.status === "present").length;
  const attendancePercent = total ? (present / total) * 100 : 0;

  if (attendancePercent >= 90) feedback.push(`Attendance: Excellent`);
  else if (attendancePercent >= 75) feedback.push(`Attendance: Satisfactory`);
  else feedback.push(`Attendance: Poor, needs improvement`);

  return feedback;
};

module.exports = { generateFeedback };
