var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
const exphandlebars = require("express-handlebars");
const path = require("path");

// Require all models
var db = require("./models");

const PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev", {
  skip: function (req, res) {return req.url === "/favicon.ico"}
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useCreateIndex: true });

// Handlebars
const handlebars = exphandlebars.create({
  extname: "handlebars",
  layoutsDir: path.join(__dirname, "views/layouts"),
  defaultLayout: "main",
  helpers: path.join(__dirname, "/helpers"),
  partialsDir: path.join(__dirname, "views/partials")
});

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");


// Routes
require("./routes/apiRoutes.js")(app);

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
