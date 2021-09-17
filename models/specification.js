var mongoose = require("mongoose");
const Joi = require("@hapi/joi");

var specificationSchema = new mongoose.Schema({
  name: String,
  value: String,
  unit: String,
  displayOrder: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
  },
  parent: { id: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" } },
});

function validateSpecificationData(specification) {
  const schema = {
    name: Joi.string().required(),
    value: Joi.string().required(),
    unit: Joi.string().allow(""),
  };
  return Joi.validate(specification, schema);
}

const Specification = mongoose.model("Specification", specificationSchema);

module.exports.Specification = Specification;
module.exports.validateSpecificationData = validateSpecificationData;

// module.exports = mongoose.model("Specification", specificationSchema);
