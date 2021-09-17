const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
  },
  parent: { id: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" } },
}, { timestamps: true });

module.exports.Favorite = mongoose.model("favorite", favoriteSchema);
