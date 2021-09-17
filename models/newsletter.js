var mongoose = require("mongoose");

var newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  }
}, { timestamps: true });

const Newsletter = mongoose.model("newsletter", newsletterSchema);

module.exports.Newsletter = Newsletter;