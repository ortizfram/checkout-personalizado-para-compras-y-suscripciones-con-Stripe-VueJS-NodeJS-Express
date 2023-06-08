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

    res.send({
      data: "Hola",
    });
  }

  async storeOrders(req, res) {
    // venta de cursos individuales
    const productType = req.params.product_type;
    const customerId = req.body.customer_id;

    switch (productType) {
      case "course":
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 20 * 100, //20 USD
          currency: "USD",
          description: "Curso",
          customer: customerId,
        });

        if (paymentIntent) {
          // si intento TRUE + CLIENT_SECRET
          res.send({
            status: true,
            data: paymentIntent.client_secret,
          });
        }

        res.send({
          // if not data for payment intent ERROR MSG
          status: false,
          message: "No paymentIntent created",
        });
        break;

      default:
        res.send({
          status: false,
          message: "No right product type",
        });
        break;
    }
  }
}

module.exports = PaymentController;
