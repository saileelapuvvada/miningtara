var express = require("express");
var router = express.Router({ mergeParams: true });
var { Equipment } = require("../models/equipment");
var Images = require("../models/image");
var middleware = require("../middleware");
var fs = require("fs");
var multer = require("multer");

var storage = multer.diskStorage({
  destination: "./public/uploads/images/",
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

var imageFilter = function (req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter });

// NEW Images FORM
router.get("/new", middleware.isLoggedIn, function (req, res) {
  Equipment.findById(req.params.id, function (err, foundEquipment) {
    if (err || !foundEquipment) {
      req.flash("error", "Image add error. Equipment not found");
      res.redirect("back");
    } else {
      res.render("images/new", { equipment: foundEquipment });
    }
  });
});

// NEW Images POST
router.post(
  "/",
  middleware.isLoggedIn,
  upload.single("imageFile"),
  function (req, res) {
    if (req.file) {
      Equipment.findById(req.params.id, function (err, equipment) {
        if (err) {
          req.flash("error", "Image add error. Equipment not found.");
          res.redirect("/equipment/" + req.params.id + "/edit");
        } else {
          Images.create({}, function (err, image) {
            if (err) {
              req.flash("error", "Image add error. Could not create image.");
              res.redirect("/equipment/" + req.params.id + "/edit");
            } else {
              image.author.id = req.user._id;
              image.author.username = req.user.username;
              image.filename = req.file.originalname;
              image.file = req.file.path.substring(6); //strip 'public'
              image.save(function (err) {
                if (err) {
                  req.flash("error", "Image add error. Could not save image.");
                  res.redirect("/equipment/" + req.params.id + "/edit");
                } else {
                  equipment.images.push(image);
                  equipment.save(function (err) {
                    if (err) {
                      req.flash(
                        "error",
                        "Image add error. Could not save equipment."
                      );
                      res.redirect("/equipment/" + req.params.id + "/edit");
                    } else {
                      res.redirect("/equipment/" + equipment._id + "/edit");
                    }
                  });
                }
              });
            }
          });
        }
      });
    } else {
      req.flash("error", "Image add error. No file received.");
      res.redirect("/equipment/" + req.params.id + "/edit");
    }
  }
);

// EDIT image FORM
router.get(
  "/:image_id/edit",
  middleware.checkImageOwnership,
  function (req, res) {
    Equipment.findById(req.params.id, function (err, foundEquipment) {
      if (err || !foundEquipment) {
        req.flash("error", "Image update error. Equipment not found.");
        return res.redirect("back");
      }
      Images.findById(req.params.image_id, function (err, foundImage) {
        if (err) {
          req.flash("error", "Image update error. Image not found.");
          res.redirect("back");
        } else {
          res.render("images/edit", {
            equipment_id: req.params.id,
            image: foundImage,
          });
        }
      });
    });
  }
);

// UPDATE image POST
router.put(
  "/:image_id",
  middleware.checkImageOwnership,
  upload.single("imageFile"),
  function (req, res) {
    if (req.file) {
      Images.findById(req.params.image_id, function (err, image) {
        if (err) {
          req.flash("error", "Image update error. Image not found.");
          res.redirect("/equipment/" + req.params.id + "/edit");
        } else {
          fs.unlink("./public" + image.file, function (err) {
            if (err) {
              req.flash(
                "error",
                "Image update error. Could not delete image file."
              );
              res.redirect("/equipment/" + req.params.id + "/edit");
            } else {
              image.file = req.file.path.substring(6);
              image.filename = req.file.originalname;
              image.save(function (err) {
                if (err) {
                  req.flash(
                    "error",
                    "Image update error. Could not save image."
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
      req.flash("error", "Image update error. No file received.");
      res.redirect("/equipment/" + req.params.id + "/edit");
    }
  }
);

// DESTROY image
router.delete(
  "/:image_id",
  middleware.checkImageOwnership,
  function (req, res) {
    Images.findById(req.params.image_id, function (err, image) {
      if (err) {
        req.flash("error", "Image delete error. Could not find image.");
        res.redirect("/equipment/" + req.params.id + "/edit");
      } else {
        fs.unlink("./public" + image.file, function (err) {
          if (err) {
            req.flash(
              "error",
              "Image delete error. Could not delete image file."
            );
            res.redirect("/equipment/" + req.params.id + "/edit");
          } else {
            image.remove(function (err) {
              if (err) {
                req.flash(
                  "error",
                  "Image delete error. Could not delete image."
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
