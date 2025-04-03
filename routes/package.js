const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/auth");
const Booking = require("../models/Booking");
const Package = require("../models/Package");
const Razorpay = require("razorpay");
const { sendBookingEmail } = require("../utils/emailService");
// Create new booking
router.post("/", async (req, res) => {
  try {
    const {
      package: packageId,
      startDate,
      numberOfPeople,
      contactDetails,
      specialRequirements,
      totalAmount,
    } = req.body;

    // Validate request body
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }
    // Add this near your other routes
    router.post("/test-email", protect, async (req, res) => {
      try {
        const { testEmail } = require("../utils/emailService");
        const result = await testEmail(req.user.email);

        if (result) {
          res.json({ success: true, message: "Test email sent successfully" });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Failed to send test email" });
        }
      } catch (error) {
        console.error("Test email route error:", error);
        res
          .status(500)
          .json({ success: false, message: "Error in test email route" });
      }
    });
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID format",
      });
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    // Create payment order
    router.post("/:bookingId/payment", protect, async (req, res) => {
      try {
        const booking = await Booking.findById(req.params.bookingId);

        const order = await razorpay.orders.create({
          amount: booking.totalAmount * 100, // amount in paise
          currency: "INR",
          receipt: booking._id.toString(),
          payment_capture: 1,
        });

        res.json({
          success: true,
          data: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error creating payment order",
        });
      }
    });
    // Validate other required fields
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "Start date is required",
      });
    }

    if (
      !numberOfPeople ||
      !numberOfPeople.adults ||
      numberOfPeople.adults < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one adult is required",
      });
    }

    if (!contactDetails || !contactDetails.phone || !contactDetails.email) {
      return res.status(400).json({
        success: false,
        message: "Contact details (phone and email) are required",
      });
    }

    // Validate package exists
    const tourPackage = await Package.findById(packageId);
    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Validate start date is in the future
    const startDateObj = new Date(startDate);
    if (startDateObj < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Start date must be in the future",
      });
    }

    // Calculate total amount if not provided
    const calculatedAmount =
      tourPackage.price.amount *
      (numberOfPeople.adults + (numberOfPeople.children || 0) * 0.5);

    // Validate total amount matches calculated amount
    if (Math.abs(calculatedAmount - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Total amount does not match package price calculation",
      });
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user._id,
      package: packageId,
      startDate: startDateObj,
      numberOfPeople: {
        adults: numberOfPeople.adults,
        children: numberOfPeople.children || 0,
      },
      contactDetails: {
        phone: contactDetails.phone,
        alternatePhone: contactDetails.alternatePhone || "",
        email: contactDetails.email,
      },
      specialRequirements: specialRequirements || "",
      totalAmount: calculatedAmount,
      bookingStatus: "pending",
      paymentStatus: "pending",
    });

    // Populate package details for email
    await booking.populate("package", "title duration price");

    // Send email notification
    try {
      const emailSent = await sendBookingEmail(booking);
      if (!emailSent) {
        console.warn(
          `Warning: Failed to send booking confirmation email to ${booking.contactDetails.email}`
        );
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't return error to client, continue with booking creation
    }

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error);

    // Send more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating booking",
    });
  }
});

// Add route to update booking status
router.patch("/:bookingId/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: pending, confirmed, cancelled, completed",
      });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.bookingStatus = status;
    await booking.save();

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating booking status",
    });
  }
});
// Get bookings dashboard stats
router.get("/stats", protect, async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$bookingStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const recentBookings = await Booking.find()
      .sort("-createdAt")
      .limit(5)
      .populate("package", "title");

    res.json({
      success: true,
      data: {
        stats,
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching booking stats",
    });
  }
});
// Check package availability for dates
router.get("/availability/:packageId", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const existingBookings = await Booking.find({
      package: req.params.packageId,
      startDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      bookingStatus: { $in: ["confirmed", "pending"] },
    });

    const availableDates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const bookingsOnDate = existingBookings.filter(
        (booking) =>
          booking.startDate.toDateString() === currentDate.toDateString()
      );

      availableDates.push({
        date: new Date(currentDate),
        available: bookingsOnDate.length < 3, // Assuming max 3 bookings per day
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: availableDates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking availability",
    });
  }
});
// Get all bookings for a user
router.get("/my-bookings", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("package", "title duration price images")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
    });
  }
});

// Get single booking
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("package")
      .populate("user", "firstName lastName email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is authorized to view this booking
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking details",
    });
  }
});

// Cancel booking
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is authorized to cancel this booking
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // Update booking status
    booking.bookingStatus = "cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
    });
  }
});
// Modified package route (remove admin check)
router.get("/", protect, async (req, res) => {
  try {
    const packages = await Package.find({ active: true })
      .sort("-createdAt")
      .select("title duration price images destination"); // Remove populate

    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching packages"
    });
  }
});

module.exports = router;
