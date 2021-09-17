var mongoose = require("mongoose");
const Joi = require("@hapi/joi");

var featureSchema = new mongoose.Schema({
  text: String,
  displayOrder: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
  },
  parent: { id: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" } },
});

featureSchema.index({ text: "text" }, { weights: { text: 1 } });

function validateFeatureData(feature) {
  const schema = {
    text: Joi.string().required(),
  };
  return Joi.validate(feature, schema);
}

const Feature = mongoose.model("Feature", featureSchema);

module.exports.Feature = Feature;
module.exports.validateFeatureData = validateFeatureData;

// module.exports = mongoose.model("Feature", featureSchema);
