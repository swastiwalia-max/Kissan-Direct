const {
    createOrder,
    getOrdersByBuyer,
    getOrderById,
    updateOrderStatus
} = require("../services/orderService");


const placeOrder = async (req, res) => {
    try {
        const { items, logistics_cost } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "At least one order item is required"
            });
        }

        const order = await createOrder(
            req.user.id,
            items,
            logistics_cost || 0
        );

        res.status(201).json({
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: error.message
        });
    }
};


const getOrders = async (req, res) => {
    try {
        const orders = await getOrdersByBuyer(req.user.id);

        res.json({
            orders
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await getOrderById(id, req.user.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.json({
            order
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const changeOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "PENDING_PAYMENT",
            "PLACED",
            "ACCEPTED",
            "DRIVER_ASSIGNED",
            "PICKED_UP",
            "IN_TRANSIT",
            "DELIVERED",
            "CANCELLED"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const order = await updateOrderStatus(id, status);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    placeOrder,
    getOrders,
    getOrder,
    changeOrderStatus
};