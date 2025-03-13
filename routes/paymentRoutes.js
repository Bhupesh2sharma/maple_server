const express = require("express");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const { protect, authorize } = require('../middleware/auth'); // Import both middleware functions
const Booking = require('../models/Booking');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');
require("dotenv").config();

const router = express.Router();



// Route to create an order - Protected for authenticated users
router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    const options = {
      amount: amount * 100, // Convert to paisa
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});




// Route to verify payment signature - Protected for authenticated users
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

      if (generatedSignature === razorpay_signature) {
        // Update booking status
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            paymentStatus: 'completed',
            'paymentDetails.razorpayOrderId': razorpay_order_id,
            'paymentDetails.razorpayPaymentId': razorpay_payment_id,
            'paymentDetails.razorpaySignature': razorpay_signature,
            bookingStatus: 'confirmed'
          },
          { new: true }
        ).populate('package'); // Make sure to populate package details for the email
  
        // Send payment confirmation emails
        await sendPaymentConfirmationEmail(updatedBooking);
  
        res.json({
          success: true,
          message: "Payment verified successfully"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid signature"
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
        error: error.message
      });
    }
  });

// Route to update booking payment status - Protected for authenticated users
router.put('/bookings/:id/payment', protect, async (req, res) => {
  try {
    const { paymentId, status } = req.body;
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('package');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    booking.paymentStatus = status;
    booking.paymentId = paymentId;
    booking.updatedAt = Date.now();

    await booking.save();

    // Send confirmation emails if payment is completed
    if (status === 'completed') {
      try {
        await sendBookingEmail(booking);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking payment status'
    });
  }
});




// Optional: Route to get payment status - Protected for authenticated users
router.get('/bookings/:id/payment-status', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('paymentStatus paymentId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: booking.paymentStatus,
        paymentId: booking.paymentId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status'
    });
  }
});

module.exports = router;