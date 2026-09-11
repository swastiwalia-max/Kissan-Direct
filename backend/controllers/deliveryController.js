// backend/controllers/deliveryController.js

const db = require('../config/db');

// Helper function to fetch driver_profiles record using user ID from decoded JWT
const getDriverProfile = async (userId) => {
  const query = 'SELECT * FROM driver_profiles WHERE user_id = $1';
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
};

// GET /api/deliveries/available
exports.getAvailableDeliveries = async (req, res) => {
  try {
    // Check if the authenticated user has the DRIVER role
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ success: false, message: 'Access denied. Driver role required.' });
    }

    const query = `
      SELECT id, order_id, pickup_latitude, pickup_longitude, drop_latitude, drop_longitude, status 
      FROM deliveries 
      WHERE status = 'ASSIGNED' AND driver_id IS NULL
    `;
    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/deliveries/:id/accept
exports.acceptDelivery = async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ success: false, message: 'Access denied. Driver role required.' });
    }

    const deliveryId = req.params.id;
    const userId = req.user.id;

    // Retrieve driver profile
    const driverProfile = await getDriverProfile(userId);
    if (!driverProfile) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    // Verify delivery exists
    const checkQuery = 'SELECT * FROM deliveries WHERE id = $1';
    const checkResult = await db.query(checkQuery, [deliveryId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const delivery = checkResult.rows[0];

    // Ensure delivery isn't already assigned to a driver
    if (delivery.driver_id) {
      return res.status(400).json({ success: false, message: 'Delivery has already been taken by another driver' });
    }

    // Assign driver_id to delivery
    const updateQuery = `
      UPDATE deliveries 
      SET driver_id = $1, assigned_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [driverProfile.id, deliveryId]);

    return res.status(200).json({
      success: true,
      message: 'Delivery accepted successfully',
      data: updateResult.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/deliveries/:id/pickup
exports.pickupDelivery = async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ success: false, message: 'Access denied. Driver role required.' });
    }

    const deliveryId = req.params.id;
    const userId = req.user.id;

    const driverProfile = await getDriverProfile(userId);
    if (!driverProfile) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const checkQuery = 'SELECT * FROM deliveries WHERE id = $1';
    const checkResult = await db.query(checkQuery, [deliveryId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const delivery = checkResult.rows[0];

    // Ensure only assigned driver can make updates
    if (delivery.driver_id !== driverProfile.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to this delivery' });
    }

    // Strict status transition check: ASSIGNED -> PICKED_UP
    if (delivery.status !== 'ASSIGNED') {
      return res.status(400).json({ success: false, message: 'Cannot pickup delivery unless status is ASSIGNED' });
    }

    const updateQuery = `
      UPDATE deliveries 
      SET status = 'PICKED_UP', picked_up_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [deliveryId]);

    return res.status(200).json({
      success: true,
      message: 'Delivery status updated to PICKED_UP',
      data: updateResult.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/deliveries/:id/start
exports.startDelivery = async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ success: false, message: 'Access denied. Driver role required.' });
    }

    const deliveryId = req.params.id;
    const userId = req.user.id;

    const driverProfile = await getDriverProfile(userId);
    if (!driverProfile) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const checkQuery = 'SELECT * FROM deliveries WHERE id = $1';
    const checkResult = await db.query(checkQuery, [deliveryId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const delivery = checkResult.rows[0];

    // Ensure only assigned driver can make updates
    if (delivery.driver_id !== driverProfile.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to this delivery' });
    }

    // Strict status transition check: PICKED_UP -> IN_TRANSIT
    if (delivery.status !== 'PICKED_UP') {
      return res.status(400).json({ success: false, message: 'Cannot start delivery transit unless status is PICKED_UP' });
    }

    const updateQuery = `
      UPDATE deliveries 
      SET status = 'IN_TRANSIT' 
      WHERE id = $1 
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [deliveryId]);

    return res.status(200).json({
      success: true,
      message: 'Delivery status updated to IN_TRANSIT',
      data: updateResult.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/deliveries/:id/complete
exports.completeDelivery = async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ success: false, message: 'Access denied. Driver role required.' });
    }

    const deliveryId = req.params.id;
    const userId = req.user.id;

    const driverProfile = await getDriverProfile(userId);
    if (!driverProfile) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const checkQuery = 'SELECT * FROM deliveries WHERE id = $1';
    const checkResult = await db.query(checkQuery, [deliveryId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const delivery = checkResult.rows[0];

    // Ensure only assigned driver can make updates
    if (delivery.driver_id !== driverProfile.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to this delivery' });
    }

    // Strict status transition check: IN_TRANSIT -> DELIVERED
    if (delivery.status !== 'IN_TRANSIT') {
      return res.status(400).json({ success: false, message: 'Cannot complete delivery unless status is IN_TRANSIT' });
    }

    const updateQuery = `
      UPDATE deliveries 
      SET status = 'DELIVERED', delivered_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [deliveryId]);

    return res.status(200).json({
      success: true,
      message: 'Delivery status updated to DELIVERED',
      data: updateResult.rows[0]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};