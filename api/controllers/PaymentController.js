const stripe = require("stripe")(
  "sk_test_51MfSIVF7xSH4WmUPecW4tJED9sfp1FZhrgnyiI8DTCJF5ZNMwmGX5ZqiLaVKfAcvpVMJnPLXxqMx9j0pi6BrFeLV00vRBJ9XGm"
);

class PaymentController {
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
          amount: 20 * 10000, //20 USD, * 100 pq esta en centavos
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
        const membershipPriceId = "price_1NH5oXF7xSH4WmUPRLN7fPQf";
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
    // open localtunnel: $ lt --port 5000
    res.send({
      data: "Hola desde localhost",
    });
  }
}

module.exports = PaymentController;
