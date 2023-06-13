const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class ProfileController {
  async indexSubscriptions(req, res) {
    const customerId = req.params.customer_id;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    if (subscriptions) {
      res.send({
        status: true,
        data: subscriptions.data,
      });
    } else {
      res.send({
        status: false,
        message: "No subscriptions found",
      });
    }
  }
}

module.exports = ProfileController;
