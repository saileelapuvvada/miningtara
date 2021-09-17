const express = require("express");
const middlewareObj = require('../middleware');
const { validateContactUs, ContactUs } = require('../models/contactUs');
const router = express.Router({ mergeParams: true });

router.get("/", function (req, res) {
  res.render("contact/contact");
});

router.post('/', middlewareObj.sanitizeContactUsData, async (req, res) => {

  const { error } = validateContactUs(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message })
  }

  try {
    await ContactUs.create(req.body)
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message })
  }

  return res.status(200).json({ status: true, message: "recieved" })
})

module.exports = router;
