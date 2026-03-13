const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String },
  phone: { type: String },
  fatherName: { type: String },
  motherName: { type: String },
  address: { type: String },
  bloodGroup: { type: String },
  photo: { type: String } // Path to student photograph
});

module.exports = mongoose.model("Student", studentSchema);
