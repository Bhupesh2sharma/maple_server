const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

// Get all packages (Public route)
router.get('/', async (req, res) => {
    try {
        const packages = await Package.find();
        res.status(200).json({
            success: true,
            data: packages
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Add this new route - Get single package by ID (Public route)
router.get('/:id', async (req, res) => {
    try {
        const package = await Package.findById(req.params.id);
        
        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.status(200).json({
            success: true,
            data: package
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Create new package (Admin only)
router.post('/', 
    protect, 
    authorize('admin'),
    upload.fields([
        { name: 'images', maxCount: 3 },
        { name: 'pdfBrochure', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const packageData = JSON.parse(req.body.packageData);
            
            // Add image URLs if images were uploaded
            if (req.files && req.files.images) {
                packageData.images = req.files.images.map(file => ({
                    url: `/uploads/images/${file.filename}`,
                    caption: file.originalname
                }));
            }
            
            // Add PDF URL if PDF was uploaded
            if (req.files && req.files.pdfBrochure) {
                packageData.pdfBrochure = {
                    url: `/uploads/pdfs/${req.files.pdfBrochure[0].filename}`,
                    filename: req.files.pdfBrochure[0].originalname
                };
            }

            const package = await Package.create(packageData);
            res.status(201).json({
                success: true,
                data: package
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Update package (Admin only)
router.put('/:id',
    protect,
    authorize('admin'),
    upload.fields([
        { name: 'images', maxCount: 3 },
        { name: 'pdfBrochure', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const packageData = JSON.parse(req.body.packageData);
            
            if (req.files && req.files.images) {
                packageData.images = req.files.images.map(file => ({
                    url: `/uploads/images/${file.filename}`,
                    caption: file.originalname
                }));
            }
            
            if (req.files && req.files.pdfBrochure) {
                packageData.pdfBrochure = {
                    url: `/uploads/pdfs/${req.files.pdfBrochure[0].filename}`,
                    filename: req.files.pdfBrochure[0].originalname
                };
            }

            const package = await Package.findByIdAndUpdate(
                req.params.id,
                packageData,
                { new: true, runValidators: true }
            );

            if (!package) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
            }

            res.status(200).json({
                success: true,
                data: package
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// Delete package (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const package = await Package.findByIdAndDelete(req.params.id);
        
        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Package deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;