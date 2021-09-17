const Joi = require('@hapi/joi');
const express = require("express");
const router = express.Router({ mergeParams: true });
const { Newsletter } = require("../models/newsletter");


router.post("/", async (req, res) => {

  const { error } = Joi.validate(req.body, { email: Joi.string().email().required() });

  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message })
  }


  try {
    await Newsletter.create({ email: req.body.email })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status: false, message: `Email already subscribed` })
    }
    return res.status(400).json({ status: false, message: error.message })
  }

  return res.status(200).json({ status: true, message: "subscribed" })
});

module.exports = router;
