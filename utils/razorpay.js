const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret:XFEEyKQyMZav77JnfRIOTWLR
});

module.exports = razorpay;