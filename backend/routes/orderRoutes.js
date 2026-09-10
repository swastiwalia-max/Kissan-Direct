const express = require("express");

const {
    placeOrder,
    getOrders,
    getOrder,
    changeOrderStatus
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// Place a new order
router.post("/", authMiddleware, placeOrder);

// Get buyer's orders
router.get("/", authMiddleware, getOrders);

// Get one specific order
router.get("/:id", authMiddleware, getOrder);

// Update order status
router.put("/:id/status", authMiddleware, changeOrderStatus);


module.exports = router;