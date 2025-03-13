const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, authorize } = require('../middleware/auth');

// Submit testimonial (Public route)
router.post('/', async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    
    res.status(201).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all approved testimonials (Public route)
router.get('/approved', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true })
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all testimonials (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Approve/Reject testimonial (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.status(200).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete testimonial (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;