const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const User = require('../models/User');
const Testimonial = require('../models/Testimonial');
const Contact = require('../models/Contact');

// Get dashboard stats
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    // Get current date and first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all required stats
    const [
      totalBookings,
      monthlyBookings,
      activePackages,
      totalUsers,
      monthlyUsers,
      testimonials,
      pendingContacts,
      recentBookings
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      Package.countDocuments({ active: true }),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: firstDayOfMonth } }),
      Testimonial.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Booking.find()
        .sort('-createdAt')
        .limit(5)
        .populate('user', 'firstName lastName')
        .populate('package', 'title')
    ]);

    // Calculate total revenue
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate monthly revenue
    const monthlyRevenue = await Booking.aggregate([
      { 
        $match: { 
          status: 'confirmed',
          createdAt: { $gte: firstDayOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        activePackages,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        testimonialCount: testimonials,
        contactFormCount: pendingContacts,
        monthlyStats: {
          bookings: monthlyBookings,
          revenue: monthlyRevenue[0]?.total || 0,
          users: monthlyUsers
        },
        recentBookings: recentBookings.map(booking => ({
          _id: booking._id,
          bookingId: booking.bookingId,
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          packageName: booking.package.title,
          bookingDate: booking.createdAt,
          amount: booking.amount,
          status: booking.status
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

module.exports = router;