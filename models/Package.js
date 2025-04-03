const mongoose = require('mongoose');

const itineraryDaySchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true
    },
    title: String,
    description: String
});

const packageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Package title is required'],
        trim: true
    },
    duration: {
        days: {
            type: Number,
            required: true
        },
        nights: {
            type: Number,
            required: true
        }
    },
    description: {
        type: String,
        required: [true, 'Package description is required']
    },
    destination: {
        type: String,
        required: [true, 'Destination is required']
    },
    price: {
        amount: {
            type: Number,
            required: [true, 'Price is required']
        },
        currency: {
            type: String,
            default: '₹'
        }
    },
    itinerary: [itineraryDaySchema],
    inclusions: [String],
    exclusions: [String],
    images: [{
        url: String,
        caption: String
    }],
    pdfBrochure: {
        url: String,
        filename: String
    },
    cancellationPolicy: {
        type: String,
        required: true
    },
    featured: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Package', packageSchema); 
