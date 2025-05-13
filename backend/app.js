const express = require("express");
const data = require("../public/data/data.json");

const app = express();

app.use((req, res, next) => {
  console.log("Requête reçue");
  next();
});

app.use((req, res, next) => {
  res.status(201);
  next();
});
app.use((req, res, next) => {
  res.json({ message: "Votre requête a bien été reçue" });
  next();
});

app.use((req, res) => {
  console.log("Réponse envoyée");
});

module.exports = app;
