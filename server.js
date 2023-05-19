//if (process.env.NODE_ENV !== 'production') {
require('dotenv').config()
//}
/**
 * -------------- IMPORTS ----------------
 */
const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser'); // Middleware
var cookieParser = require('cookie-parser');
const path = require("path");
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');

const initializePassport = require('./config/passport.config.js');
initializePassport(passport);

const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

/**
 * -------------- DB SYNC (SEQUELIZE) ----------------
 */
// const db = require("./models");

// // sync() - just sync db (data only)
// // sync({ force: true }) - force Sequelize to create a table, dropping it first if it already existed
// // sync({ alter: true }) - alters the columns and data types of an existing table to match the model
// db.sequelize.sync()
//   .then(() => {
//     console.log("Synced db.");
//   })
//   .catch((err) => {
//     console.log("Failed to sync db: " + err.message);
//   });


/**
 * -------------- VIEW ENGINE ----------------
 */
const viewsDirPath = path.join(__dirname, "views");
app.set("view engine", "ejs");
app.set("views", viewsDirPath);
// include the following when create public static folder
app.use(express.static(path.join(__dirname, "public")));

/**
 * -------------- ROUTES ----------------
 * API routes 
 * login/register page: /login, /register, 
 * user routes: /home/...
 * admin routes: /admin/...
 */
require('./routes/passport.routes.js')(app, passport);

// USER ROUTES (/home/...)
const user = require("./routes/user.routes.js");
app.use("/home/profile", user);

const address = require("./routes/address.routes.js");
app.use("/home/address", address);

const recipeForUser = require("./routes/recipeUser.routes.js");
app.use("/home/recipes", recipeForUser);

const cart = require("./routes/cart.routes.js");
app.use("/home/cart", cart);

const checkout = require("./routes/payment.routes.js");
app.use("/home/checkout", checkout);

// EMPLOYEE ROUTES (/admin/...)
const recipeForAdmin = require("./routes/recipeAdmin.routes.js");
app.use("/admin/recipes", recipeForAdmin);

const inventory = require("./routes/inventory.routes.js");
app.use("/admin/inventory", inventory);

const admin = require("./routes/admin.routes.js");
app.use("/admin/profile", admin);

const adminAddress = require("./routes/adminAddress.routes.js");
app.use("/admin/address", adminAddress);

const orders = require("./routes/order.routes.js");
app.use("/home/orders", orders);

app.get('/', (req, res) => {res.redirect('/home')})


/**
 * -------------- SERVER ----------------
 */
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});