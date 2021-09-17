const express = require("express");
const middlewareObj = require('../middleware');
const { Equipment } = require('../models/equipment');
const { Favorite } = require('../models/favorite');
const router = express.Router({ mergeParams: true });
const ObjectId = require('mongoose').Types.ObjectId;


router.get('/equipment/:equipmentId', middlewareObj.isLoggedIn, async (req, res) => {

  const equipment = await Equipment.findById(req.params.equipmentId);

  if (!equipment) {
    return res.status(400).json({ status: false, message: `equipment does not exist` })
  }

  const favExists = await Favorite.findOne({
    parent: { id: new ObjectId(equipment._id) },
    author: { id: new ObjectId(req.user._id), username: req.user.username }
  })

  if (favExists) {
    await Favorite.deleteOne({
      _id: favExists._id
    })
    return res.redirect('/equipment')
  }

  try {
    await Favorite.create({
      parent: { id: equipment._id },
      author: {
        id: req.user._id,
        username: req.user.username
      }
    })
    return res.redirect('/equipment')
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message })
  }
})

module.exports = router;
