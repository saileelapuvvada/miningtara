var mongoose = require("mongoose");

var imageSchema = new mongoose.Schema({
  file: String,
  fileId: String,
  filename: String,
  displayOrder: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
  },
  parent: { id: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" } },
});

module.exports = mongoose.model("Image", imageSchema);
