// backend/routes/deliveryRoutes.js

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all delivery routes using the exported authMiddleware
router.use(authMiddleware);

// GET /api/deliveries/available
router.get('/available', deliveryController.getAvailableDeliveries);

// POST /api/deliveries/:id/accept
router.post('/:id/accept', deliveryController.acceptDelivery);

// POST /api/deliveries/:id/pickup
router.post('/:id/pickup', deliveryController.pickupDelivery);

// POST /api/deliveries/:id/start
router.post('/:id/start', deliveryController.startDelivery);

// POST /api/deliveries/:id/complete
router.post('/:id/complete', deliveryController.completeDelivery);

module.exports = router;