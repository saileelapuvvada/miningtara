var { Equipment } = require("../models/equipment");
var { Feature } = require("../models/feature");
var { Specification } = require("../models/specification");
var Images = require("../models/image");
var Datasheets = require("../models/datasheet");
var middlewareObj = {};

middlewareObj.checkEquipmentOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Equipment.findById(req.params.id, function (err, foundEquipment) {
      if (err || !foundEquipment) {
        req.flash("error", "Sorry, The equipment was not found");
        res.redirect("back");
      } else {
        if (foundEquipment.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash(
            "error",
            "Equipment authorization: Sorry, you are not authorized to access this function"
          );
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "Please log in to access this function");
    res.redirect("back");
  }
};

middlewareObj.checkFeatureOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Feature.findById(req.params.feature_id, function (err, foundFeatures) {
      if (err || !foundFeatures) {
        req.flash("error", "Sorry, the equipment feature was not found");
        res.redirect("back");
      } else {
        if (foundFeatures.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash(
            "error",
            "Feature authorization: Sorry, you are not authorized to access this function"
          );
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "Please log in to access this function");
    res.redirect("back");
  }
};

middlewareObj.checkSpecificationOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Specification.findById(
      req.params.specification_id,
      function (err, foundSpecifications) {
        if (err || !foundSpecifications) {
          req.flash(
            "error",
            "Sorry, the equipment specification was not found"
          );
          res.redirect("back");
        } else {
          if (
            foundSpecifications.author.id.equals(req.user._id) ||
            req.user.isAdmin
          ) {
            next();
          } else {
            req.flash(
              "error",
              "Specification authorization: Sorry, you are not authorized to access this function"
            );
            res.redirect("back");
          }
        }
      }
    );
  } else {
    req.flash("error", "Please log in to access this function");
    res.redirect("back");
  }
};

middlewareObj.checkImageOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Images.findById(req.params.image_id, function (err, foundImages) {
      if (err || !foundImages) {
        req.flash("error", "Sorry, the equipment image was not found");
        res.redirect("back");
      } else {
        if (foundImages.author.id.equals(req.user._id) || req.user.isAdmin) {
          next();
        } else {
          req.flash(
            "error",
            "Image authorization: Sorry, you are not authorized to access this function"
          );
          res.redirect("back");
        }
      }
    });
  } else {
    req.flash("error", "Please log in to access this function");
    res.redirect("back");
  }
};

middlewareObj.checkDatasheetOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    Datasheets.findById(
      req.params.datasheet_id,
      function (err, foundDatasheets) {
        if (err || !foundDatasheets) {
          req.flash("error", "Sorry, the equipment datasheet was not found");
          res.redirect("back");
        } else {
          if (
            foundDatasheets.author.id.equals(req.user._id) ||
            req.user.isAdmin
          ) {
            next();
          } else {
            req.flash(
              "error",
              "Datasheet authorization: Sorry, you are not authorized to access this function"
            );
            res.redirect("back");
          }
        }
      }
    );
  } else {
    req.flash("error", "Please log in to access this function");
    res.redirect("back");
  }
};

middlewareObj.checkUserAccountOwnership = function (req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user.id === req.params.id || req.user.isAdmin) {
      return next();
    } else {
      req.flash(
        "error",
        "Account authorization: Sorry, you are not authorized to access this function"
      );
      return res.redirect("/equipment");
    }
  }
  req.flash(
    "error",
    "Account authorization: Sorry, you are not authorized to access this function"
  );
  res.redirect("/equipment");
};

middlewareObj.isLoggedIn = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please log in to access this function");
  res.redirect("/login");
};

middlewareObj.isAdmin = function (req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user && req.user.isAdmin) {
      return next();
    } else {
      req.flash(
        "error",
        "Admin verification: Sorry, you are not authorized to access this function"
      );
      return res.redirect("back");
    }
  }
  req.flash(
    "error",
    "Admin verification: Sorry, you are not authorized to access this function"
  );
  res.redirect("back");
};

middlewareObj.isActive = function (req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user && req.user.status === "active") {
      return next();
    } else {
      req.flash(
        "error",
        "Status verification: Sorry, you are not authorized to access this function"
      );
      return res.redirect("back");
    }
  }
  req.flash(
    "error",
    "Status verification: Sorry, you are not authorized to access this function"
  );
  res.redirect("back");
};

middlewareObj.sanitizeNewUserData = function (req, res, next) {
  req.body.username = req.sanitize(req.body.username);
  req.body.password = req.sanitize(req.body.password);
  req.body.firstname = req.sanitize(req.body.firstname);
  req.body.lastname = req.sanitize(req.body.lastname);
  req.body.email = req.sanitize(req.body.email);
  req.body.companyName = req.sanitize(req.body.companyName);
  req.body.address.street1 = req.sanitize(req.body.address.street1);
  req.body.address.street2 = req.sanitize(req.body.address.street2);
  req.body.address.city = req.sanitize(req.body.address.city);
  req.body.address.province = req.sanitize(req.body.address.province);
  req.body.address.code = req.sanitize(req.body.address.code);
  req.body.phone = req.sanitize(req.body.phone);
  req.body.website = req.sanitize(req.body.website);
  req.body.companyReg = req.sanitize(req.body.companyReg);
  req.body.vatNumber = req.sanitize(req.body.vatNumber);
  return next();
};

middlewareObj.sanitizeUpdatedUserData = function (req, res, next) {
  req.body = {
    username: req.sanitize(req.body.username),
    status: req.sanitize(req.body.status),
    firstname: req.sanitize(req.body.firstname),
    lastname: req.sanitize(req.body.lastname),
    email: req.sanitize(req.body.email),
    companyName: req.sanitize(req.body.company_name),
    address: {
      street1: req.sanitize(req.body.address_1),
      street2: req.sanitize(req.body.address_2),
      city: req.sanitize(req.body.address_city),
      province: req.sanitize(req.body.address_province),
      code: req.sanitize(req.body.address_code),
    },
    phone: req.sanitize(req.body.phone),
    website: req.sanitize(req.body.website),
    companyReg: req.sanitize(req.body.company_reg_no),
    vatNumber: req.sanitize(req.body.vat_number),
    userType: req.sanitize(req.body.user_type),
    mesmaId: req.sanitize(req.body.memsa_id)
  }
  return next();
};

middlewareObj.sanitizeEquipmentData = function (req, res, next) {
  req.body.equipment.name = req.sanitize(req.body.equipment.name);
  req.body.equipment.type = req.sanitize(req.body.equipment.type);
  req.body.equipment.oem = req.sanitize(req.body.equipment.oem);
  req.body.equipment.description = req.sanitize(req.body.equipment.description);
  req.body.equipment.trl = req.sanitize(req.body.equipment.trl);
  req.body.equipment.visibility = req.sanitize(req.body.equipment.visibility);
  req.body.equipment.mineActivity = req.sanitize(
    req.body.equipment.mineActivity
  );
  req.body.equipment.oreLocation = req.sanitize(req.body.equipment.oreLocation);
  req.body.equipment.rockHardness = req.sanitize(
    req.body.equipment.rockHardness
  );
  req.body.equipment.mineral = req.sanitize(req.body.equipment.mineral);
  req.body.equipment.miningMethod = req.sanitize(
    req.body.equipment.miningMethod
  );
  req.body.equipment.miningCycle = req.sanitize(req.body.equipment.miningCycle);
  req.body.equipment.verified = req.sanitize(req.body.equipment.verified);
  return next();
};

middlewareObj.sanitizeContactUsData = function (req, res, next) {
  req.body.email = req.sanitize(req.body.email);
  req.body.name = req.sanitize(req.body.name);
  req.body.phone = req.sanitize(req.body.phone);
  req.body.subject = req.sanitize(req.body.subject);
  req.body.message = req.sanitize(req.body.message);
  return next()
}

middlewareObj.sanitizeFeatureData = function (req, res, next) {
  req.body.feature.text = req.sanitize(req.body.feature.text);
  // req.body.feature.displayOrder = req.sanitize(req.body.feature.displayOrder);
  return next();
};

middlewareObj.sanitizeSpecificationData = function (req, res, next) {
  req.body.specification.name = req.sanitize(req.body.specification.name);
  req.body.specification.value = req.sanitize(req.body.specification.value);
  req.body.specification.unit = req.sanitize(req.body.specification.unit);
  // req.body.feature.displayOrder = req.sanitize(req.body.feature.displayOrder);
  return next();
};

module.exports = middlewareObj;
