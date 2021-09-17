var express = require("express");
var router = express.Router({ mergeParams: true });
var { Equipment } = require("../models/equipment");
var {
  Specification,
  validateSpecificationData,
} = require("../models/specification");
var middleware = require("../middleware");

// NEW Specification FORM
router.get(
  "/new",
  middleware.isLoggedIn,
  middleware.isActive,
  async function (req, res) {
    await Equipment.findById(req.params.id)
      .populate("specifications")
      .exec(function (err, foundEquipment) {
        if (err || !foundEquipment) {
          req.flash("error", "New specification error. Equipment not found");
          res.redirect("back");
        } else {
          res.render("specifications/new", { equipment: foundEquipment });
        }
      });
  }
);

// NEW Specification
router.post(
  "/",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.sanitizeSpecificationData,
  function (req, res) {
    const { error } = validateSpecificationData(req.body.specification);
    if (error) {
      req.flash("error", error.details[0].message);
      return res
        .status(400)
        .redirect("/equipment/" + req.params.id + "/specifications/new");
    }
    Equipment.findById(req.params.id, function (err, equipment) {
      if (err) {
        req.flash("error", "Create specification error. Equipment not found");
        res.redirect("/equipment/" + equipment._id + "/specifications/new");
      } else {
        Specification.create(
          req.body.specification,
          function (err, specification) {
            if (err) {
              req.flash(
                "error",
                "Create specification error. Could not create specification."
              );
              res.redirect(
                "/equipment/" + equipment._id + "/specifications/new"
              );
            } else {
              specification.author.id = req.user._id;
              specification.author.username = req.user.username;
              specification.parent.id = req.params.id;
              specification.save(function (err) {
                if (err) {
                  req.flash(
                    "error",
                    `Create specification error. Could not save the specification. ${err.message}`
                  );
                  return res.redirect(
                    "/equipment/" + equipment._id + "/specifications/new"
                  );
                } else {
                  equipment.specifications.push(specification);
                  equipment.save(function (err) {
                    if (err) {
                      req.flash(
                        "error",
                        `Create specification error. Could not save the equipment. ${err.message}`
                      );
                      return res.redirect(
                        "/equipment/" + equipment._id + "/specifications/new"
                      );
                    } else {
                      res.redirect(
                        "/equipment/" + equipment._id + "/specifications/new"
                      );
                    }
                  });
                }
              });
            }
          }
        );
      }
    });
  }
);

// EDIT specification Form
router.get(
  "/:specification_id/edit",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkSpecificationOwnership,
  function (req, res) {
    Equipment.findById(req.params.id, function (err, foundEquipment) {
      if (err || !foundEquipment) {
        req.flash("error", "Edit specification error. Equipment not found.");
        return res.redirect("back");
      }
      Specification.findById(
        req.params.specification_id,
        function (err, foundSpecification) {
          if (err) {
            req.flash(
              "error",
              "Edit specification error. Specification not found."
            );
            res.redirect("back");
          } else {
            res.render("specifications/edit", {
              equipment_id: req.params.id,
              specification: foundSpecification,
            });
          }
        }
      );
    });
  }
);

// UPDATE specification
router.put(
  "/:specification_id",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkSpecificationOwnership,
  middleware.sanitizeSpecificationData,
  function (req, res) {
    const { error } = validateSpecificationData(req.body.specification);
    if (error) {
      req.flash("error", error.details[0].message);
      return res
        .status(400)
        .redirect("/equipment/" + req.params.id + "/specifications/new");
    }
    Specification.updateOne(
      { _id: req.params.specification_id },
      { $set: req.body.specification },
      function (err, updatedSpecification) {
        if (err) {
          req.flash(
            "error",
            "Edit specification error. Could not update specification."
          );
          res.redirect("back");
        } else {
          res.redirect("/equipment/" + req.params.id + "/specifications/new");
        }
      }
    );
  }
);

// DESTROY
router.delete(
  "/:specification_id",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkSpecificationOwnership,
  function (req, res) {
    Specification.findOneAndDelete(
      { _id: req.params.specification_id },
      function (err) {
        if (err) {
          req.flash(
            "error",
            "Delete specification error. Could not delete specification."
          );
          res.redirect("back");
        } else {
          res.redirect("/equipment/" + req.params.id + "/specifications/new");
        }
      }
    );
  }
);

module.exports = router;
