// ==== IMPORTS/ DECLARATIONS ===========
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const PaymentController = require("./controllers/PaymentController");
const paymentController = new PaymentController();
// =======================================

app.use(bodyParser.json());

// # ROUTES
app.post("/login", paymentController.login);
app.post("/orders/:product_type", paymentController.storeOrders);
app.post("/webhook", paymentController.completePayment); // se encarga de leer eventos

module.exports = app;
