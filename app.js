var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  flash = require("connect-flash"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  methodOverride = require("method-override"),
  { User } = require("./models/user"),
  expressSanitizer = require("express-sanitizer"),
  config = require("./config");

var equipmentRoutes = require("./routes/equipment");
var featuresRoutes = require("./routes/features");
var specificationsRoutes = require("./routes/specifications");
var imagesRoutes = require("./routes/images");
var datasheetsRoutes = require("./routes/datasheets");
var indexRoutes = require("./routes/index");
var usersRoutes = require("./routes/users");
const contactRoutes = require("./routes/contact")
const newsletterRoutes = require("./routes/newsletter")
const favorites = require("./routes/favroite")

const {
  db: { host, port, name },
} = config;
const connectionString = `mongodb+srv://shorturl501:JN5CVGNu5HXW4RR6@test.ts665.mongodb.net/tara?retryWrites=true&w=majority`;
try {
  mongoose
    .connect(connectionString)
    .then(() => {
      console.log("Connected to DB!");
    })
    .catch((err) => {
      console.log("ERROR:", err.message);
    });
} catch (err) {
  console.log("ERROR:", err.message, "Set DATABASEURL environment variable");
}

mongoose.Promise = Promise;
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/assets"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(expressSanitizer());

// PASSPORT CONFIG
app.use(
  require("express-session")({
    secret: "The quick brown fox",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// THIS FUNCTION IS CALLED ON EVERY ROUTE
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/equipment", equipmentRoutes);
app.use("/equipment/:id/features", featuresRoutes);
app.use("/equipment/:id/specifications", specificationsRoutes);
app.use("/equipment/:id/images", imagesRoutes);
app.use("/equipment/:id/datasheets", datasheetsRoutes);
app.use("/users", usersRoutes);
app.use("/contact", contactRoutes)
app.use("/favorite", favorites)
app.use('/newsletter', newsletterRoutes)

app.listen(config.app.port, config.app.host, function () {
  console.log(`Server is listening on port: ${config.app.port}`);
});
