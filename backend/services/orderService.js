const pool = require("../db");

const createOrder = async (buyerUserId, items, logisticsCost = 0) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Find buyer profile
        const buyerResult = await client.query(
            `SELECT id, latitude, longitude
             FROM buyer_profiles
             WHERE user_id = $1`,
            [buyerUserId]
        );

        if (buyerResult.rows.length === 0) {
            throw new Error("Buyer profile not found");
        }

        const buyer = buyerResult.rows[0];

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("At least one item is required");
        }

        let subtotal = 0;
        const orderItems = [];
        let farmerLocation = null;
        let farmerId = null;

        // Check every listing
        for (const item of items) {
            const listingResult = await client.query(
                `SELECT
                    l.id,
                    l.quantity_available,
                    l.price_per_kg,
                    l.farmer_id,
                    fp.latitude,
                    fp.longitude
                 FROM listings l
                 JOIN farmer_profiles fp ON fp.id = l.farmer_id
                 WHERE l.id = $1
                   AND l.status = 'ACTIVE'
                 FOR UPDATE`,
                [item.listing_id]
            );

            if (listingResult.rows.length === 0) {
                throw new Error(`Listing ${item.listing_id} not found`);
            }

            const listing = listingResult.rows[0];
            const quantity = Number(item.quantity);

            if (!quantity || quantity <= 0) {
                throw new Error("Quantity must be greater than 0");
            }

            if (quantity > Number(listing.quantity_available)) {
                throw new Error(
                    `Not enough quantity available for listing ${item.listing_id}`
                );
            }

            // For MVP, all items in one order must come from the same farmer
            if (farmerId === null) {
                farmerId = listing.farmer_id;
                farmerLocation = {
                    latitude: listing.latitude,
                    longitude: listing.longitude
                };
            } else if (farmerId !== listing.farmer_id) {
                throw new Error(
                    "All items in one order must be from the same farmer"
                );
            }

            const itemSubtotal = quantity * Number(listing.price_per_kg);

            subtotal += itemSubtotal;

            orderItems.push({
                listing_id: listing.id,
                quantity,
                price_per_kg: Number(listing.price_per_kg),
                subtotal: itemSubtotal
            });
        }

        const totalAmount = subtotal + Number(logisticsCost);

        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders
                (buyer_id, subtotal, logistics_cost, total_amount, status)
             VALUES ($1, $2, $3, $4, 'PLACED')
             RETURNING *`,
            [
                buyer.id,
                subtotal,
                Number(logisticsCost),
                totalAmount
            ]
        );

        const order = orderResult.rows[0];

        // Create order items and reduce inventory
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items
                    (order_id, listing_id, quantity, price_per_kg, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    order.id,
                    item.listing_id,
                    item.quantity,
                    item.price_per_kg,
                    item.subtotal
                ]
            );

            await client.query(
                `UPDATE listings
                 SET quantity_available = quantity_available - $1,
                     status = CASE
                         WHEN quantity_available - $1 <= 0
                         THEN 'SOLD_OUT'
                         ELSE status
                     END
                 WHERE id = $2`,
                [item.quantity, item.listing_id]
            );
        }

        // Create delivery record
        await client.query(
            `INSERT INTO deliveries
                (order_id, pickup_latitude, pickup_longitude,
                 drop_latitude, drop_longitude, status)
             VALUES ($1, $2, $3, $4, $5, 'ASSIGNED')`,
            [
                order.id,
                farmerLocation.latitude,
                farmerLocation.longitude,
                buyer.latitude,
                buyer.longitude
            ]
        );

        await client.query("COMMIT");

        return order;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


const getOrdersByBuyer = async (buyerUserId) => {
    const result = await pool.query(
        `SELECT
            o.*,
            d.id AS delivery_id,
            d.status AS delivery_status,
            d.driver_id
         FROM orders o
         JOIN buyer_profiles bp ON bp.id = o.buyer_id
         LEFT JOIN deliveries d ON d.order_id = o.id
         WHERE bp.user_id = $1
         ORDER BY o.created_at DESC`,
        [buyerUserId]
    );

    return result.rows;
};


const getOrderById = async (orderId, buyerUserId) => {
    const result = await pool.query(
        `SELECT
            o.*,
            d.id AS delivery_id,
            d.status AS delivery_status,
            d.driver_id
         FROM orders o
         JOIN buyer_profiles bp ON bp.id = o.buyer_id
         LEFT JOIN deliveries d ON d.order_id = o.id
         WHERE o.id = $1
           AND bp.user_id = $2`,
        [orderId, buyerUserId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const order = result.rows[0];

    const itemsResult = await pool.query(
        `SELECT
            oi.*,
            p.name AS product_name
         FROM order_items oi
         JOIN listings l ON l.id = oi.listing_id
         JOIN products p ON p.id = l.product_id
         WHERE oi.order_id = $1`,
        [orderId]
    );

    order.items = itemsResult.rows;

    return order;
};


const updateOrderStatus = async (orderId, status) => {
    const result = await pool.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, orderId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0];
};


module.exports = {
    createOrder,
    getOrdersByBuyer,
    getOrderById,
    updateOrderStatus
};