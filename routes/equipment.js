var express = require("express");
var router = express.Router();
var { Equipment, validateEquipmentData } = require("../models/equipment");
var { Feature } = require("../models/feature");
var { User } = require("../models/user");
var middleware = require("../middleware");
var fs = require("fs");
var config = require("../config");
const equipmentService = require("../services/equipment.service");
let mail = require('../helpers/mail')
async function searchEquipment(searchString) {
  let wildcard = RegExp(".[*]$");
  let wildcardTerms = [];
  let equipmentArray = []; // array of objects {equipment, score}
  let orderedArray = [];
  let unique = false;
  let uniqueEquipment = []; // array of objects {equipment}

  // Separate wildcard terms from regular search terms
  if (searchString.includes("*")) {
    let searchTerms = searchString.split(" ");
    for (i = 0; i < searchTerms.length; i++) {
      if (wildcard.test(searchTerms[i])) {
        wildcardTerms.push(searchTerms[i].slice(0, -1));
        searchTerms.splice(i, 1);
      }
    }
  }

  // Search for wildcard terms
  if (wildcardTerms.length > 0) {
    for (let t of wildcardTerms) {
      let equipment = await Equipment.find({
        $or: [
          { name: { $regex: new RegExp(t, "gi") } },
          { type: { $regex: new RegExp(t, "gi") } },
          { description: { $regex: new RegExp(t, "gi") } },
          { oem: { $regex: new RegExp(t, "gi") } },
          { miningCycle: { $regex: new RegExp(t, "gi") } },
          { mineActivity: { $regex: new RegExp(t, "gi") } },
          { oreLocation: { $regex: new RegExp(t, "gi") } },
          { rockHardness: { $regex: new RegExp(t, "gi") } },
          { mineral: { $regex: new RegExp(t, "gi") } },
          { miningMethod: { $regex: new RegExp(t, "gi") } },
        ],
      })
        .limit(config.equip.maxSearchResults)
        .populate("images")
        .exec()
        .catch(function (err) {
          req.flash("error", "Equipment search encountered an error");
          return res.redirect("/equipment");
        });

      if (equipment && equipment.length > 0) {
        equipment.forEach((equip) => {
          equipmentArray.push({ equipment: equip, score: 1 });
        });
      }
    }
  }

  const regex = new RegExp(escapeRegex(searchString), "gi");

  // Search for the regular terms in Equipment
  let equipment = await Equipment.find(
    { $text: { $search: regex } },
    { score: { $meta: "textScore" } }
  )
    .sort({
      score: { $meta: "textScore" },
    })
    .limit(config.equip.maxSearchResults)
    .populate("images")
    .exec()
    .catch(function (err) {
      req.flash("error", "Equipment search encountered an error");
      return res.redirect("/equipment");
    });

  if (equipment && equipment.length > 0) {
    equipment.forEach((equip) => {
      equipmentArray.push({ equipment: equip, score: equip._doc.score });
    });
  }

  // Search for the regular terms in Features
  let features = await Feature.find(
    { $text: { $search: regex } },
    { score: { $meta: "textScore" } }
  )
    .sort({
      score: { $meta: "textScore" },
    })
    .limit(config.equip.maxSearchResults)
    .exec()
    .catch(function (err) {
      req.flash("error", "Equipment search encountered an error");
      return res.redirect("/equipment");
    });

  if (features && features.length > 0) {
    for (const feature of features) {
      let equip = await Equipment.findById(feature.parent.id)
        .populate("images")
        .exec()
        .catch(function (err) {
          req.flash("error", "Equipment search encountered an error");
          return res.redirect("/equipment");
        });
      if (equipmentArray.length > 0) {
        for (let e of equipmentArray) {
          if (JSON.stringify(equip._id) === JSON.stringify(e.equipment._id)) {
            e.score = e.score + feature._doc.score;
            unique = false;
            break;
          } else {
            unique = true;
          }
        }
      }
      if (equipmentArray.length === 0 || unique) {
        equipmentArray.push({ equipment: equip, score: feature._doc.score });
      }
    }
  }

  compare = (a, b) => b.score - a.score;
  equipmentArray.sort(compare);

  orderedArray = equipmentArray.map((e) => {
    return e.equipment;
  });

  uniqueEquipment = Array.from(new Set(orderedArray.map((a) => a.id))).map(
    (id) => {
      return orderedArray.find((a) => a.id === id);
    }
  );

  return [uniqueEquipment, uniqueEquipment.length];
}

router.get("/search", async function (req, res) {
  req.query.search = req.sanitize(req.query.search);
  if (req.query.search) {
    let equipmentCount = 0;
    let equipment = [];
    let pageType = "search";

    [equipment, equipmentCount] = await searchEquipment(req.query.search);

    if (equipment.length > 0) {
      noMatch = null;
    } else {
      noMatch = "Sorry, there are no results for that query, please try again.";
    }

    res.render("equipment/index", {
      equipment: equipment,
      pageType: pageType,
      noMatch: noMatch,
    });
  } else {
    res.redirect("/equipment");
  }
});
//approve or reject equipment
router.put(
  "/approve/equipment/:id",
  middleware.isAdmin,
  middleware.isActive,
  async function (req, res) {
    let equipment = await Equipment.findOne({ _id: req.params.id });
    let user = User.findOne({ _id: equipment.author._id });
    let text;
    Equipment.updateOne(
      { _id: req.params.id },
      { $set: { approvalStatus: req.body.status, comment: req.body.comment } },
      async function (err, updatedEquipment) {
        if (err) {
          req.flash(
            "error",
            "Update equipment error. Could not update equipment status."
          );
          return res
            .status(400)
            .redirect("/equipment/" + req.params.id + "/edit");
        } else {
          if (req.body.status == 'approved') {
            text = '<p>Hello , Your Equipment ' + equipment.name + ' have been ' + req.body.status + ' by TARA .</p>'
          } else {
            text = '<p>Hello , Your Equipment ' + equipment.name + ' have been ' + req.body.status + ' by TARA .</p> <br>Reason-' + req.body.comment + '</br>'
          }
          let subject = 'Equipment Status - ' + req.body.status
          let body = text
          let toMail = user.email
          try { mail.sendEmail(subject, body, toMail) } catch (e) {
            console.log('mail not sent')
          }
          res.send({ status: 'Success', message: 'Equipment Succesfully ' + req.body.status }).redirect("/equipment/");
        }
      }
    );
  }
);
router.get("/", async function (req, res) {
  let pageSize = config.equip.maxResultsPerPage;
  let equipmentCount = 0;
  let equipment = [];
  let pageType = "all";
  let pageNumber = req.query.pageNumber || 1;

  let filters = {
  };

  if (req.query.miningMethod) {
    filters.miningMethodArr = { $in: req.query.miningMethod.split(',') };
  }
  if (req.query.mineral) {
    filters.mineralArr = { $in: req.query.mineral.split(',') };
  }
  if (req.query.miningType) {
    filters.oreLocation = { $in: req.query.miningType.split(',') }
  }
  if (req.query.miningActivity) {
    filters.mineActivityArr = { $in: req.query.miningActivity.split(',') }
  }
  if (req.query.miningCycle) {
    filters.miningCycleArr = { $in: req.query.miningCycle.split(',') }
  }

  [equipment, equipmentCount] = await equipmentService.getEquipments(
    pageNumber,
    pageSize,
    req.user,
    filters
  );

  equipment = await equipmentService.addFavoriteField(equipment, req)

  if (equipment.length > 0) {
    noMatch = null;
  } else {
    noMatch = "Sorry, there are no results for that query, please try again.";
  }

  res.render("equipment/index", {
    equipment: equipment,
    pageType: pageType,
    pageNumber: Number(pageNumber),
    numPages: Math.ceil(equipmentCount / pageSize),
    noMatch: noMatch,
    filters: {
      miningMethod: filters.miningMethodArr ? filters.miningMethodArr.$in : [],
      mineral: filters.mineralArr ? filters.mineralArr.$in : [],
      miningType: filters.oreLocation ? filters.oreLocation.$in : [],
      miningActivity: filters.mineActivityArr ? filters.mineActivityArr.$in : [],
      miningCycle: filters.miningCycleArr ? filters.miningCycleArr.$in : [],
    },
  });
});

async function getEquipmentById(equipmentIds) {
  let equipment = [];

  for (let id of equipmentIds) {
    let foundEquipment = await Equipment.findById(id)
      .populate("features images datasheets specifications")
      .exec()
      .catch(function (err) {
        req.flash("error", "Product compare encountered an error");
        return res.redirect("/equipment");
      });
    if (foundEquipment) {
      equipment.push(foundEquipment);
    }
  }

  return equipment;
}

router.get("/compare", async function (req, res) {
  res.render("equipment/compare");
  // if (req.query.compareSet) {
  //   let equipmentIds = req.query.compareSet.split(",");
  //   if (equipmentIds.length < 2) {
  //     req.flash("error", "Please select at least two equipment.");
  //     return res.redirect("/equipment");
  //   }
  //   let equipment = [];
  //   equipment = await getEquipmentById(equipmentIds);
  //   if (equipment && equipment.length > 0) {
  //     res.render("equipment/compare", { equipment: equipment });
  //   } else {
  //     req.flash("error", "Equipment compare encountered an error");
  //     return res.redirect("/equipment");
  //   }
  // } else {
  //   req.flash(
  //     "error",
  //     "No equipment were selected. Please select at least two equipment."
  //   );
  //   return res.redirect("/equipment");
  // }
});

//NEW - Displays a form to create new equipment
router.get(
  "/new",
  middleware.isLoggedIn,
  middleware.isActive,
  function (req, res) {
    res.render("equipment/new");
  }
);

// CREATE - Add a new element to DB
router.post(
  "/",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.sanitizeEquipmentData,
  function (req, res) {
    const { error } = validateEquipmentData(req.body.equipment);
    if (error) {
      req.flash("error", error.details[0].message);
      return res.status(400).redirect("/equipment/new");
    }

    req.body.equipment.author = {
      id: req.user._id,
      username: req.user.username,
    };

    req.body.equipment.verified = "No";

    Equipment.create(req.body.equipment, function (err, newlyCreated) {
      if (err && err.code === 11000) {
        req.flash(
          "error",
          "Equipment name already exists. Please use a different name."
        );
        return res.redirect("/equipment/new");
      }
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/equipment/new");
      }
      res.redirect("/equipment/");
    });
  }
);

// SHOW - Display more information about an element
router.get("/:id", async function (req, res) {
  await Equipment.findById(req.params.id)
    .populate("features images datasheets specifications")
    .exec(async function (err, foundEquipment) {
      if (err || !foundEquipment) {
        req.flash(
          "error",
          "Sorry, show equipment details error encountered. Equipment not found."
        );
        res.redirect("back");
      } else {
        await User.findById(foundEquipment.author.id).exec(function (
          err,
          foundUser
        ) {
          if (err || !foundUser) {
            req.flash(
              "error",
              "Show equipment details error. Supplier details not found."
            );
            res.redirect("back");
          } else {
            foundUser.username = "";
            foundUser.password = "";
            foundUser.status = "";
            foundUser.companyReg = "";
            foundUser.vatNumber = "";
            res.render("equipment/show", {
              equipment: foundEquipment,
              user: foundUser,
            });
          }
        });
      }
    });
});

// UDATE Equipment Form
router.get(
  "/:id/edit",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkEquipmentOwnership,
  async function (req, res) {
    await Equipment.findById(req.params.id)
      .populate("features images datasheets specifications")
      .exec(async function (err, foundEquipment) {
        if (err || !foundEquipment) {
          req.flash(
            "error",
            "Sorry, show equipment details error encountered. Equipment not found."
          );
          res.redirect("back");
        } else {
          await User.findById(foundEquipment.author.id).exec(function (
            err,
            foundUser
          ) {
            if (err || !foundUser) {
              req.flash(
                "error",
                "Show equipment details error. Supplier details not found."
              );
              res.redirect("back");
            } else {
              foundUser.username = "";
              foundUser.password = "";
              foundUser.status = "";
              foundUser.companyReg = "";
              foundUser.vatNumber = "";
              res.render("equipment/edit", {
                equipment: foundEquipment,
                user: foundUser,
              });
            }
          });
        }
      });
  }
);

// UPDATE equipment ROUTE
router.put(
  "/:id",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkEquipmentOwnership,
  middleware.sanitizeEquipmentData,
  function (req, res) {
    const { error } = validateEquipmentData(req.body.equipment);
    if (error) {
      req.flash("error", error.details[0].message);
      return res.status(400).redirect("/equipment/" + req.params.id + "/edit");
    }

    Equipment.updateOne(
      { _id: req.params.id },
      { $set: req.body.equipment },
      function (err, updatedEquipment) {
        if (err) {
          req.flash(
            "error",
            "Update equipment error. Could not update equipment details."
          );
          return res
            .status(400)
            .redirect("/equipment/" + req.params.id + "/edit");
        } else {
          res.redirect("/equipment/" + req.params.id);
        }
      }
    );
  }
);

// DESTROY equipment ROUTE - cascade deletes through the Feature, Images, and Datasheets
router.delete(
  "/:id",
  middleware.isLoggedIn,
  middleware.isActive,
  middleware.checkEquipmentOwnership,
  function (req, res) {
    Equipment.findById(req.params.id)
      .populate("features images datasheets specifications")
      .exec(function (err, foundEquipment) {
        if (err || !foundEquipment) {
          req.flash(
            "error",
            "Delete equipment error. Could not find equipment."
          );
          res.redirect("/equipment");
        } else {
          try {
            for (let i = 0; i < foundEquipment.datasheets.length; i++) {
              fs.unlink(
                "./public" + foundEquipment.datasheets[i].file,
                function (err) {
                  if (err) {
                    req.flash(
                      "error",
                      `Delete equipment error. Error deleting datasheet file.`
                    );
                    return res.redirect("/equipment");
                  } else {
                    foundEquipment.datasheets[i].remove(function (err) {
                      if (err) {
                        req.flash(
                          "error",
                          `Delete equipment error. Error deleting datasheet.`
                        );
                        return res.redirect("/equipment");
                      }
                    });
                  }
                }
              );
            }
            for (let i = 0; i < foundEquipment.images.length; i++) {
              fs.unlink(
                "./public" + foundEquipment.images[i].file,
                function (err) {
                  if (err) {
                    req.flash(
                      "error",
                      `Delete equipment error. Error deleting image file.`
                    );
                    return res.redirect("/equipment");
                  } else {
                    foundEquipment.images[i].remove(function (err) {
                      if (err) {
                        req.flash(
                          "error",
                          `Delete equipment error. Error deleting image file.`
                        );
                        return res.redirect("/equipment");
                      }
                    });
                  }
                }
              );
            }
            for (let i = 0; i < foundEquipment.features.length; i++) {
              foundEquipment.features[i].remove(function (err) {
                if (err) {
                  req.flash(
                    "error",
                    `Delete equipment error. Error deleting feature.`
                  );
                  return res.redirect("/equipment");
                }
              });
            }
            for (let i = 0; i < foundEquipment.specifications.length; i++) {
              foundEquipment.specifications[i].remove(function (err) {
                if (err) {
                  req.flash(
                    "error",
                    `Delete equipment error. Error deleting specification.`
                  );
                  return res.redirect("/equipment");
                }
              });
            }
          } catch (err) {
            req.flash("error", "Delete equipment error.");
            return res.redirect("/equipment");
          }
          try {
            foundEquipment.remove();
            req.flash("success", "Equipment deleted");
            res.redirect("/equipment");
          } catch (err) {
            req.flash(
              "error",
              "Delete equipment error. Error deleting equipment."
            );
            res.redirect("/equipment");
          }
        }
      });
  }
);

// THIS WAS THE PREVIOUS VERSION - ONE ABOVE HAS BETTER ERROR CHECK, LEAVING IT HERE FOR NOW
// // DESTROY equipment ROUTE - cascade deletes through the Feature, Images, and Datasheets
// router.delete("/:id",
//     middleware.isLoggedIn,
//     middleware.isActive,
//     middleware.checkEquipmentOwnership,
//     function (req, res) {

//         Equipment.findById(req.params.id).populate('features images datasheets specifications').exec(function (err, foundEquipment) {
//             if (err || !foundEquipment) {
//                 req.flash("error", "Delete equipment error. Could not find equipment data.");
//                 res.redirect("/equipment");
//             } else {
//                 try {
//                     for (let i = 0; i < foundEquipment.datasheets.length; i++) {
//                         fs.unlink('./public' + foundEquipment.datasheets[i].file, function (err) {
//                             if (err) {
//                                 req.flash("error", `Delete equipment error. Error deleting datasheet file.`);
//                                 return res.redirect("/equipment");
//                             }
//                         });
//                         foundEquipment.datasheets[i].remove();
//                     }
//                     for (let i = 0; i < foundEquipment.images.length; i++) {
//                         fs.unlink('./public' + foundEquipment.images[i].file, function (err) {
//                             if (err) {
//                                 req.flash("error", `Delete equipment error. Error deleting image file.`);
//                                 return res.redirect("/equipment");
//                             }
//                         });
//                         foundEquipment.images[i].remove();
//                     }
//                     for (let i = 0; i < foundEquipment.features.length; i++) {
//                         foundEquipment.features[i].remove();
//                     }
//                     for (let i = 0; i < foundEquipment.specifications.length; i++) {
//                         foundEquipment.specifications[i].remove();
//                     }
//                 } catch (err) {
//                     req.flash("error", "Delete equipment error.");
//                     return res.redirect("/equipment");
//                 }
//                 try {
//                     foundEquipment.remove();
//                     req.flash("success", "Equipment deleted");
//                     res.redirect("/equipment");
//                 } catch (err) {
//                     req.flash("error", "Error deleting equipment");
//                     res.redirect("/equipment");
//                 }
//             }
//         });
//     }
// );

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
