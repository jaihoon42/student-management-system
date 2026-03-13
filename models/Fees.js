const mongoose = require("mongoose");

const feesSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Fees", feesSchema);
