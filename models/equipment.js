var mongoose = require("mongoose");
const Joi = require("@hapi/joi");

var equipmentSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  type: { type: String, required: true },
  oem: { type: String, required: true },
  description: { type: String, required: true },
  trl: String,
  visibility: String,
  mineActivity: { type: String, required: true },
  oreLocation: String,
  rockHardness: String,
  mineral: { type: String, required: true },
  approvalStatus: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
  comment: { type: String },
  miningMethod: { type: String, required: true },
  miningCycle: { type: String, required: true },
  verified: String,
  author: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
  },
  features: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feature" }],
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Image" }],
  datasheets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Datasheet" }],
  specifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Specification" },
  ],
  created_date: { type: Date, default: Date.now },
}, { strict: false });

equipmentSchema.index(
  {
    "$**": "text",
  },
  {
    weights: {
      name: 1,
      type: 1,
      oem: 1,
      description: 1,
      trl: 1,
      mineActivity: 1,
      oreLocation: 1,
      rockHardness: 1,
      mineral: 1,
      miningMethod: 1,
      miningCycle: 1,
    },
  }
);

function validateEquipmentData(equipment) {
  const schema = {
    name: Joi.string().required(),
    type: Joi.string().required(),
    oem: Joi.string().required(),
    description: Joi.string().required(),
    miningCycle: Joi.string().required(),
    mineActivity: Joi.string().required(),
    miningMethod: Joi.string().required(),
    mineral: Joi.string().required(),
    trl: Joi.string()
      .regex(/^TRL[1-9]$/)
      .allow(""),
    oreLocation: Joi.string().allow(""),
    rockHardness: Joi.string().allow(""),
    visibility: Joi.string().allow(""),
    verified: Joi.string().allow(""),
  };
  return Joi.validate(equipment, schema);
}

const Equipment = mongoose.model("Equipment", equipmentSchema);

module.exports.Equipment = Equipment;
module.exports.validateEquipmentData = validateEquipmentData;
// module.exports = mongoose.model("Equipment", equipmentSchema);
