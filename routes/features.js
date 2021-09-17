var express = require("express");
var router = express.Router({ mergeParams: true });
var { Equipment } = require("../models/equipment");
var { Feature, validateFeatureData } = require("../models/feature");
var middleware = require("../middleware");

// NEW Feature FORM
router.get(
  "/new",
  middleware.isLoggedIn,
  middleware.isActive,
  async function (req, res) {
    await Equipment.findById(req.params.id)
      .populate("features")
      .exec(function (err, foundEquipment) {
        if (err || !foundEquipment) {
          req.flash("error", "New feature error. Equipment not found");
          res.redirect("back");
        } else {
          res.render("features/new", { equipment: foundEquipment });
        }
      });
  }
);

// NEW Feature
router.post(
  "/",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.sanitizeFeatureData,
  function (req, res) {
    const { error } = validateFeatureData(req.body.feature);
    if (error) {
      req.flash("error", error.details[0].message);
      return res
        .status(400)
        .redirect("/equipment/" + req.params.id + "/features/new");
    }
    Equipment.findById(req.params.id, function (err, equipment) {
      if (err) {
        req.flash("error", "Create feature error. Equipment not found.");
        res.redirect("/equipment/" + equipment._id + "/features/new");
      } else {
        Feature.create(req.body.feature, function (err, feature) {
          if (err) {
            req.flash(
              "error",
              "Create feature error. Could not create feature."
            );
            res.redirect("/equipment/" + equipment._id + "/features/new");
          } else {
            feature.author.id = req.user._id;
            feature.author.username = req.user.username;
            feature.parent.id = req.params.id;
            feature.save(function (err) {
              if (err) {
                req.flash(
                  "error",
                  `Create feature error. Could not save feature. ${err.message}`
                );
                return res.redirect(
                  "/equipment/" + equipment._id + "/features/new"
                );
              } else {
                equipment.features.push(feature);
                equipment.save(function (err) {
                  if (err) {
                    req.flash(
                      "error",
                      `Create feature error. Could not save equipment. ${err.message}`
                    );
                    return res.redirect(
                      "/equipment/" + equipment._id + "/features/new"
                    );
                  } else {
                    res.redirect(
                      "/equipment/" + equipment._id + "/features/new"
                    );
                  }
                });
              }
            });
          }
        });
      }
    });
  }
);

// EDIT feature Form (Note: Route is not used anymore)
router.get(
  "/:feature_id/edit",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkFeatureOwnership,
  function (req, res) {
    Equipment.findById(req.params.id, function (err, foundEquipment) {
      if (err || !foundEquipment) {
        req.flash("error", "Edit feature error. Equipment not found");
        return res.redirect("back");
      }
      Feature.findById(req.params.feature_id, function (err, foundFeature) {
        if (err) {
          req.flash("error", "Edit feature error. Feature not found.");
          res.redirect("back");
        } else {
          res.render("features/edit", {
            equipment_id: req.params.id,
            feature: foundFeature,
          });
        }
      });
    });
  }
);

// UPDATE feature
router.put(
  "/:feature_id",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkFeatureOwnership,
  middleware.sanitizeFeatureData,
  function (req, res) {
    const { error } = validateFeatureData(req.body.feature);
    if (error) {
      req.flash("error", error.details[0].message);
      return res
        .status(400)
        .redirect("/equipment/" + req.params.id + "/features/new");
    }
    Feature.updateOne(
      { _id: req.params.feature_id },
      { $set: req.body.feature },
      function (err, updatedFeatures) {
        if (err) {
          req.flash("error", "Edit feature error. Could not update feature.");
          res.redirect("back");
        } else {
          res.redirect("/equipment/" + req.params.id + "/features/new");
        }
      }
    );
  }
);

// DESTROY
router.delete(
  "/:feature_id",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkFeatureOwnership,
  function (req, res) {
    Feature.findOneAndDelete({ _id: req.params.feature_id }, function (err) {
      if (err) {
        req.flash("error", "Delete feature error. Could not delete feature.");
        res.redirect("back");
      } else {
        res.redirect("/equipment/" + req.params.id + "/features/new");
      }
    });
  }
);

module.exports = router;
