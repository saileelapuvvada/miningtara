var express = require("express");
var router = express.Router({ mergeParams: true });
var { Equipment } = require("../models/equipment");
var Datasheets = require("../models/datasheet");
var middleware = require("../middleware");
var fs = require("fs");
var multer = require("multer");

var storage = multer.diskStorage({
  destination: "./public/uploads/datasheets/",
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

var datasheetFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(pdf)$/i)) {
    return cb(new Error("Only pdf files are allowed!"), false);
  }
  cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: datasheetFilter });

// NEW Datasheet SHOW FORM
router.get("/new", middleware.isLoggedIn, function (req, res) {
  Equipment.findById(req.params.id, function (err, foundEquipment) {
    if (err || !foundEquipment) {
      req.flash("error", "Datasheet add error. Equipment not found");
      res.redirect("back");
    } else {
      res.render("datasheets/new", { equipment: foundEquipment });
    }
  });
});

// NEW Datasheet POST
router.post(
  "/",
  middleware.isLoggedIn,
  upload.single("datasheetFile"),
  function (req, res) {
    if (req.file) {
      Equipment.findById(req.params.id, function (err, equipment) {
        if (err) {
          req.flash("error", "Datasheet add error. Equipment not found.");
          res.redirect("/equipment/" + req.params.id + "/edit");
        } else {
          Datasheets.create({}, function (err, datasheet) {
            if (err) {
              req.flash(
                "error",
                "Datasheet add error. Could not create datasheet."
              );
              res.redirect("/equipment/" + req.params.id + "/edit");
            } else {
              datasheet.author.id = req.user._id;
              datasheet.author.username = req.user.username;
              datasheet.filename = req.file.originalname;
              datasheet.file = req.file.path.substring(6); //strip "public"
              datasheet.save(function (err) {
                if (err) {
                  req.flash(
                    "error",
                    "Datasheet add error. Could not save datasheet."
                  );
                  res.redirect("/equipment/" + req.params.id + "/edit");
                } else {
                  equipment.datasheets.push(datasheet);
                  equipment.save(function (err) {
                    if (err) {
                      req.flash(
                        "error",
                        "Datasheet add error. Could not save equipment."
                      );
                      res.redirect("/equipment/" + req.params.id + "/edit");
                    } else {
                      res.redirect("/equipment/" + req.params.id + "/edit");
                    }
                  });
                }
              });
            }
          });
        }
      });
    } else {
      req.flash("error", "Datasheet add error. No file received.");
      res.redirect("/equipment/" + req.params.id + "/edit");
    }
  }
);

// EDIT datasheet FORM
router.get(
  "/:datasheet_id/edit",
  middleware.checkDatasheetOwnership,
  function (req, res) {
    Equipment.findById(req.params.id, function (err, foundEquipment) {
      if (err || !foundEquipment) {
        req.flash("error", "Datasheet update error. Equipment not found.");
        return res.redirect("back");
      }
      Datasheets.findById(
        req.params.datasheet_id,
        function (err, foundDatasheet) {
          if (err) {
            req.flash("error", "Datasheet update error. Datasheet not found");
            res.redirect("back");
          } else {
            res.render("datasheets/edit", {
              equipment_id: req.params.id,
              datasheet: foundDatasheet,
            });
          }
        }
      );
    });
  }
);

// UPDATE datasheet
router.put(
  "/:datasheet_id",
  middleware.checkDatasheetOwnership,
  upload.single("datasheetFile"),
  function (req, res) {
    if (req.file) {
      Datasheets.findById(req.params.datasheet_id, function (err, datasheet) {
        if (err) {
          req.flash("error", "Datasheet update error. Datasheet not found.");
          res.redirect("/equipment/" + req.params.id + "/edit");
        } else {
          fs.unlink("./public" + datasheet.file, function (err) {
            if (err) {
              req.flash(
                "error",
                "Datasheet update error. Could not delete datasheet file."
              );
              res.redirect("/equipment/" + req.params.id + "/edit");
            } else {
              datasheet.filename = req.file.originalname;
              datasheet.file = req.file.path.substring(6);
              datasheet.save(function (err) {
                if (err) {
                  req.flash(
                    "error",
                    "Datasheet update error. Could not save datasheet."
                  );
                  res.redirect("/equipment/" + req.params.id + "/edit");
                } else {
                  res.redirect("/equipment/" + req.params.id + "/edit");
                }
              });
            }
          });
        }
      });
    } else {
      req.flash("error", "Datasheet add error. No file received.");
      res.redirect("/equipment/" + req.params.id + "/edit");
    }
  }
);

// DESTROY
router.delete(
  "/:datasheet_id",
  middleware.checkDatasheetOwnership,
  function (req, res) {
    Datasheets.findById(req.params.datasheet_id, function (err, datasheet) {
      if (err) {
        req.flash("error", "Datasheet delete error. Could not find datasheet.");
        res.redirect("/equipment/" + req.params.id + "/edit");
      } else {
        fs.unlink("./public" + datasheet.file, function (err) {
          if (err) {
            req.flash(
              "error",
              "Datasheet delete error. Could not delete datasheet file."
            );
            res.redirect("/equipment/" + req.params.id + "/edit");
          } else {
            datasheet.remove(function (err) {
              if (err) {
                req.flash(
                  "error",
                  "Datasheet delete error. Could not delete datasheet."
                );
                res.redirect("/equipment/" + req.params.id + "/edit");
              } else {
                res.redirect("/equipment/" + req.params.id + "/edit");
              }
            });
          }
        });
      }
    });
  }
);

module.exports = router;
