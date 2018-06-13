const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mainRoutes = require('./index.js');

app.use(bodyParser.urlencoded({ extended: false}));
app.set("view engine", "pug");
app.use(express.static('public'));
app.use(mainRoutes);

app.listen(3000, () => {
  console.log("The app is running on localhost:3000")
});
