const Joi = require('@hapi/joi');
const mongoose = require("mongoose");

const ContactUsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  name: String,
  phone: String,
  subject: String,
  message: String,
}, { timestamps: true });

const ContactUs = mongoose.model("contactUs", ContactUsSchema);

function validateContactUs(ContactUs) {
  const schema = {
    email: Joi.string().email().required(),
    name: Joi.string().allow(""),
    phone: Joi.string().allow(""),
    subject: Joi.string().allow(""),
    message: Joi.string().required()
  };
  return Joi.validate(ContactUs, schema);
}

module.exports.ContactUs = ContactUs;
module.exports.validateContactUs = validateContactUs;