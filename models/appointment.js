const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  identityNumber: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: String,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "Bekliyor"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Appointment", appointmentSchema);