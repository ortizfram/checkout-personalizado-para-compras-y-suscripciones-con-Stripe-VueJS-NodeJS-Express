require("dotenv").config();
const fs = require("fs");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const stripe = require("stripe")("");

class PaymentController {
  constructor() {
    this.completePayment = this.completePayment.bind(this);
  }

  async login(req, res) {
    // crear stripe customer con email y retornar response
    const customer = await stripe.customers.create({
      email: req.body.email,
    });

    if (customer) {
      res.send({
        data: customer,
        status: true,
      });
    } else {
      res.send({
        message: "Customer not created",
        status: false,
      });
    }
  }

  async storeOrders(req, res) {
    // venta de cursos individuales
    const productType = req.params.product_type;
    const customerId = req.body.customer_id; // de stripe, se obtiene con un email

    if (!customerId) {
      res.send({
        status: false,
        message: "No Customer",
      });
    }

    switch (productType) {
      // para hacer todo necesito el payment_intent.client_secret,
      // en sub se saca desde el ultimo invoice
      case "course":
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 20 * 1000, //20 USD, * 100 pq esta en centavos
          currency: "ARS",
          description: "Curso individual",
          customer: customerId,
        });

        if (paymentIntent) {
          // si intento TRUE + CLIENT_SECRET
          res.send({
            status: true,
            data: paymentIntent.client_secret,
          });
        } else {
          res.send({
            // if not data for payment intent ERROR MSG
            status: false,
            message: "No paymentIntent created",
          });
        }
        break;

      case "subscription":
        const membershipPriceId = process.env.STRIPE_ST_MEMBERSHIP_PRICE_ID;
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              price: membershipPriceId,
            },
          ],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
        });

        if (subscription && subscription.latest_invoice) {
          // si todo exitoso retornar client secret del ultimo payment_intent latest_invoice
          res.send({
            status: true,
            data: subscription.latest_invoice.payment_intent.client_secret,
          });
        } else {
          res.send({
            status: false,
            message: "No subscription created",
          });
        }

        break;

      default:
        res.send({
          status: false,
          message: "No right product type",
        });
        break;
    }
  }

  async completePayment(req, res) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.header("Stripe-Signature"),
        process.env.STRIPE_WEBHOOK_kEY
      );

      if (event && event.data && event.data.object) {
        const dataObject = event.data.object;
        console.log(dataObject);
        res.send({
          data: "Todo correcto",
        });
      } else {
        throw new Error("Invalid event data");
      }
    } catch (error) {
      res.status(405).send({
        error: error.message,
      });
    }

    switch (event.type) {
      case "invoice.payment_succeeded":
        if (dataObject["invoice"] === "subscription_create") {
          const subscriptionId = dataObject["subscription"];
          const paymentIntentId = dataObject["payment_intent"];

          const paymentIntent = await stripe.paymentIntent.retrieve(
            paymentIntentId
          );

          try {
            const subscription = await stripe.subscriptions.update(
              subscriptionId,
              {
                default_payment_method: paymentIntent.payment_method,
              }
            );

            res.send({
              message: "Subscription completed",
            });
          } catch (error) {
            res.status(405);
            res.send({
              message: error.message,
            });
          }
        }
        break;

      case "payment_intent.succeeded":
        this.__storeDatabase(1414);

        res.send({
          status: true,
          message: "Course access created",
        });
        break;

      default:
        console.log("Undefined event type");
        break;
    }
  }

  __storeDatabase(courseId) {
    const data = fs.readFileSync("./database/db.json", {
      encoding: "utf8",
      flag: "r",
    });

    try {
      const database = JSON.parse(data);

      database.push({
        course: courseId,
      });

      fs.writeFileSync("./database/db.json", JSON.stringify(database));

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = PaymentController;
