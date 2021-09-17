var express = require("express");
var router = express.Router({ mergeParams: true });
var { Equipment } = require("../models/equipment");
var {
  User,
  validateNewUserData,
  validateUpdatedUserData,
} = require("../models/user");
var middleware = require("../middleware");
var passport = require("passport");
var _ = require("lodash");
var nodemailer = require("nodemailer");
var async = require("async");
var crypto = require("crypto");
var config = require("../config");

var transporter = nodemailer.createTransport({
  service: config.mail.service,
  auth: config.mail.auth,
});

// GET ALL Users (INDEX)
router.get("/", middleware.isAdmin, function (req, res) {
  User.find(function (err, users) {
    if (err) {
      req.flash(
        "error",
        `Users index error. Could not find users. ${err.message}`
      );
      return res.redirect("back");
    }
    res.render("users/index", { users: users });
  });
});

router.get("/forgot", function (req, res) {
  res.render("users/forgot");
});

router.post("/forgot", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash(
              "error",
              "Sorry, no registered account with that email address exists."
            );
            return res.redirect("/users/forgot");
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000;
          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        const mailOptions = {
          from: config.mail.auth.user, // sender address
          to: user.email, // list of receivers
          subject: `Reset password for TARA`, // Subject line
          text:
            "You are receiving this email because you (or someone else) have requested the reset of the password." +
            "\n\n" +
            "Please click on the following link, or paste this link into your browser to complete the process." +
            "\n\n" +
            "http://" +
            req.headers.host +
            "/users/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged",
        };
        transporter.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash(
            "success",
            `An email has been sent to ${user.email} with further instructions`
          );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/users/forgot");
    }
  );
});

router.get("/reset/:token", function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("users/forgot");
      }
      res.render("users/reset", { token: req.params.token });
    }
  );
});

router.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("back");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("back");
            }
          }
        );
      },
      function (user, done) {
        var mailOptions = {
          to: user.email,
          from: config.mail.auth.user,
          subject: "Password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        transporter.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/equipment");
    }
  );
});

// NEW User FORM (Sign Up Form)
router.get("/new", function (req, res) {
  res.render("users/new");
});

// CREATE User
router.post("/", middleware.sanitizeNewUserData, async function (req, res) {
  const { error } = validateNewUserData(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.status(400).redirect("/users/new");
  }

  var newUser = new User(_.omit(req.body, ["password"]));

  // if (req.body.adminCode === adminKey) {
  if (req.body.adminCode === config.admin.adminKey) {
    newUser.isAdmin = true;
    newUser.status = "active";
  } else {
    newUser.isAdmin = false;
    newUser.status = "pending";
  }

  let userEmailExists = await User.findOne({ email: req.body.email });
  if (userEmailExists) {
    req.flash("error", "A user with that email already exists");
    return res.status(400).redirect("/users/new");
  }

  let usernameExists = await User.findOne({ username: req.body.username });
  if (usernameExists) {
    req.flash("error", "A user with that username already exists");
    return res.status(400).redirect("/users/new");
  }

  const mailOptions = {
    from: config.mail.auth.user,
    to: config.mail.auth.user,
    subject: `New user sign up: ${newUser.firstname} ${newUser.lastname}`, // Subject line
    html: `<p>(${newUser.firstname} ${newUser.lastname}) has signed up on the TARA database.</p>`, // plain text body
  };

  try {
    User.register(newUser, req.body.password, function (err, user) {
      if (err) {
        req.flash("error", err.message);
        return res.status(400).redirect("/users/new");
      }
      passport.authenticate("local")(req, res, function () {
        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            req.flash(
              "error",
              `Unable to send email. Pls try again later. Error: ${err.message}`
            );
            return res.status(400).redirect("/users/new");
          } else {
            req.flash(
              "success",
              `Welcome ${user.username}. You will receive an email notification when your account has been activated.`
            );
            res.redirect("/equipment");
          }
        });
      });
    });
  } catch (err) {
    req.flash(
      "error",
      `Unable to update details. Please contact the system admin. Error: ${err.message}`
    );
    res.status(400).redirect("/users/new");
  }
});

// SHOW User by id
router.get(
  "/:id",
  middleware.isLoggedIn,
  middleware.checkUserAccountOwnership,
  function (req, res) {
    User.findById(req.params.id, function (err, user) {
      if (err) {
        req.flash("error", "User details error. User not found.");
        return res.redirect("back");
      }
      Equipment.find()
        .where("author.id")
        .equals(user._id)
        .exec(function (err, equipment) {
          if (err) {
            req.flash("error", "User details error. Equipment not found.");
            return res.redirect("back");
          }
          res.render("users/show", { user: user, equipment: equipment });
        });
    });
  }
);

// EDIT User Form
router.get(
  "/:id/edit",
  middleware.checkUserAccountOwnership,
  function (req, res) {
    User.findById(req.params.id, function (err, user) {
      if (err) {
        req.flash(
          "error",
          `User details error. User not found. ${err.message}`
        );
        return res.redirect("back");
      }
      res.render("users/edit", { user: user });
    });
  }
);

// UPDATE User
router.put(
  "/:id",
  middleware.sanitizeUpdatedUserData,
  middleware.checkUserAccountOwnership,
  async function (req, res) {
    const { error } = validateUpdatedUserData(req.body);
    if (error) {
      req.flash("error", error.details[0].message);
      return res.status(400).redirect("/users/" + req.params.id);
    }

    if (!req.user.isAdmin) {
      req.body = _.omit(req.body, ["status"]);
    }

    if (req.user.isAdmin) {
      req.body.isAdmin = req.body.userType === 'admin' ? true : false
    }

    const mailOptions = {
      from: config.mail.auth.user,
      to: `${config.mail.auth.user}, ${req.body.email}`,
      subject: `User update for: ${req.body.firstname} ${req.body.lastname}`,
      html: `<p>Details for ${req.body.firstname} ${req.body.lastname}, have been updated.</p>`,
    };

    try {
      User.updateOne(
        { _id: req.params.id },
        { $set: req.body },
        function (err) {
          if (err) {
            req.flash("error", err.message);
            return res.status(400).redirect("/users/" + req.params.id);
          }
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              req.flash(
                "error",
                `Unable to send email. Pls try again later. Error: ${err.message}`
              );
              return res.status(400).redirect("/users/" + req.params.id);
            } else {
              req.flash("success", `Details have been updated.`);
              res.redirect("/users/" + req.params.id);
            }
          });
        }
      );
    } catch (error) {
      req.flash(
        "error",
        `Unable to update details. Please contact the system admin. Error: ${err.message}`
      );
      res.status(400).redirect("/users/" + req.params.id);
    }
  }
);

// DESTROY
router.delete("/:id", middleware.isAdmin, function (req, res) {
  User.findOneAndDelete({ _id: req.params.id }, function (err) {
    if (err) {
      req.flash(
        "error",
        `User delete error. Unable to delete user. ${err.message}`
      );
      res.redirect("back");
    } else {
      res.redirect("/users");
    }
  });
});

module.exports = router;
