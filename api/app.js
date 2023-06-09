// ==== IMPORTS/ DECLARATIONS ===========
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();

const ProfileController = require("./controllers/ProfileController");
const profileController = new ProfileController();

const PaymentController = require("./controllers/PaymentController");
const paymentController = new PaymentController();
// =======================================

// convertir todo endpoint en json,
// y si endpoint es /webhook. No hacer nada
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// # ROUTES
app
  .post("/login", paymentController.login)
  .post("/orders/:product_type", paymentController.storeOrders)
  .post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    paymentController.completePayment
  ); // se encarga de leer eventos

// retornar subs
app.get(
  "/users/:customer_id/subscriptions",
  profileController.indexSubscriptions
);

module.exports = app;
