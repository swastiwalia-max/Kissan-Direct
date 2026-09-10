// backend/controllers/listingController.js

const pool = require("../server");

// ----------------------------------------------------
// POST /api/listings
// Farmer creates a new produce listing
// ----------------------------------------------------
const createListing = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Check if user is a FARMER
    const userResult = await pool.query(
      `SELECT id, role
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (userResult.rows[0].role !== "FARMER") {
      return res.status(403).json({
        message: "Only farmers can create listings",
      });
    }

    // 2. Find farmer profile
    const farmerResult = await pool.query(
      `SELECT id, verification_status
       FROM farmer_profiles
       WHERE user_id = $1`,
      [userId]
    );

    if (farmerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Farmer profile not found",
      });
    }

    const farmerId = farmerResult.rows[0].id;

    // Optional: only verified farmers can list produce
    if (farmerResult.rows[0].verification_status !== "VERIFIED") {
      return res.status(403).json({
        message: "Farmer profile is not verified",
      });
    }

    // 3. Get listing data from request
    const {
      product_id,
      quantity_available,
      price_per_kg,
      quality_grade,
      available_from,
    } = req.body;

    // 4. Validate required fields
    if (
      !product_id ||
      quantity_available === undefined ||
      price_per_kg === undefined ||
      !quality_grade ||
      !available_from
    ) {
      return res.status(400).json({
        message: "All listing fields are required",
      });
    }

    // 5. Validate quantity
    if (
      isNaN(quantity_available) ||
      Number(quantity_available) <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // 6. Validate price
    if (
      isNaN(price_per_kg) ||
      Number(price_per_kg) <= 0
    ) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    // 7. Check whether product exists
    const productResult = await pool.query(
      `SELECT id, name, category, unit
       FROM products
       WHERE id = $1`,
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 8. Create listing
    const listingResult = await pool.query(
      `INSERT INTO listings
       (
         farmer_id,
         product_id,
         quantity_available,
         price_per_kg,
         quality_grade,
         available_from,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       RETURNING *`,
      [
        farmerId,
        product_id,
        quantity_available,
        price_per_kg,
        quality_grade,
        available_from,
      ]
    );

    return res.status(201).json({
      message: "Listing created successfully",
      listing: listingResult.rows[0],
    });
  } catch (error) {
    console.error("Create listing error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ----------------------------------------------------
// GET /api/listings
// Get all active listings
// ----------------------------------------------------
const getListings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         l.id,
         l.farmer_id,
         l.product_id,
         l.quantity_available,
         l.price_per_kg,
         l.quality_grade,
         l.available_from,
         l.status,
         l.created_at,

         p.name AS product_name,
         p.category AS product_category,
         p.unit AS product_unit,

         fp.village,
         fp.district,
         fp.state

       FROM listings l

       JOIN products p
         ON l.product_id = p.id

       JOIN farmer_profiles fp
         ON l.farmer_id = fp.id

       WHERE l.status = 'ACTIVE'

       ORDER BY l.created_at DESC`
    );

    return res.status(200).json({
      count: result.rows.length,
      listings: result.rows,
    });
  } catch (error) {
    console.error("Get listings error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ----------------------------------------------------
// GET /api/listings/:id
// Get details of one listing
// ----------------------------------------------------
const getListingById = async (req, res) => {
  try {
    const listingId = req.params.id;

    const result = await pool.query(
      `SELECT
         l.id,
         l.farmer_id,
         l.product_id,
         l.quantity_available,
         l.price_per_kg,
         l.quality_grade,
         l.available_from,
         l.status,
         l.created_at,

         p.name AS product_name,
         p.category AS product_category,
         p.unit AS product_unit,

         fp.village,
         fp.district,
         fp.state,
         fp.latitude,
         fp.longitude,
         fp.verification_status

       FROM listings l

       JOIN products p
         ON l.product_id = p.id

       JOIN farmer_profiles fp
         ON l.farmer_id = fp.id

       WHERE l.id = $1`,
      [listingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      listing: result.rows[0],
    });
  } catch (error) {
    console.error("Get listing error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ----------------------------------------------------
// PUT /api/listings/:id
// Farmer updates their own listing
// ----------------------------------------------------
const updateListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const listingId = req.params.id;

    // 1. Check that user is a farmer
    const farmerResult = await pool.query(
      `SELECT fp.id
       FROM farmer_profiles fp
       JOIN users u
         ON fp.user_id = u.id
       WHERE u.id = $1
       AND u.role = 'FARMER'`,
      [userId]
    );

    if (farmerResult.rows.length === 0) {
      return res.status(403).json({
        message: "Only farmers can update listings",
      });
    }

    const farmerId = farmerResult.rows[0].id;

    // 2. Check that listing belongs to this farmer
    const listingResult = await pool.query(
      `SELECT *
       FROM listings
       WHERE id = $1`,
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    const listing = listingResult.rows[0];

    if (listing.farmer_id !== farmerId) {
      return res.status(403).json({
        message: "You can only update your own listings",
      });
    }

    // 3. Don't allow updates to cancelled/sold listings
    if (listing.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Only active listings can be updated",
      });
    }

    // 4. Get new values
    const {
      product_id,
      quantity_available,
      price_per_kg,
      quality_grade,
      available_from,
    } = req.body;

    // 5. Validate product if provided
    if (product_id !== undefined) {
      const productResult = await pool.query(
        `SELECT id
         FROM products
         WHERE id = $1`,
        [product_id]
      );

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }
    }

    // 6. Validate quantity if provided
    if (
      quantity_available !== undefined &&
      (isNaN(quantity_available) || Number(quantity_available) <= 0)
    ) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // 7. Validate price if provided
    if (
      price_per_kg !== undefined &&
      (isNaN(price_per_kg) || Number(price_per_kg) <= 0)
    ) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    // 8. Update listing
    const updatedResult = await pool.query(
      `UPDATE listings
       SET
         product_id = COALESCE($1, product_id),
         quantity_available = COALESCE($2, quantity_available),
         price_per_kg = COALESCE($3, price_per_kg),
         quality_grade = COALESCE($4, quality_grade),
         available_from = COALESCE($5, available_from)
       WHERE id = $6
       AND farmer_id = $7
       RETURNING *`,
      [
        product_id ?? null,
        quantity_available ?? null,
        price_per_kg ?? null,
        quality_grade ?? null,
        available_from ?? null,
        listingId,
        farmerId,
      ]
    );

    return res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("Update listing error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ----------------------------------------------------
// DELETE /api/listings/:id
// Cancel listing instead of permanently deleting it
// ----------------------------------------------------
const deleteListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const listingId = req.params.id;

    // 1. Find farmer profile belonging to logged-in user
    const farmerResult = await pool.query(
      `SELECT fp.id
       FROM farmer_profiles fp
       JOIN users u
         ON fp.user_id = u.id
       WHERE u.id = $1
       AND u.role = 'FARMER'`,
      [userId]
    );

    if (farmerResult.rows.length === 0) {
      return res.status(403).json({
        message: "Only farmers can cancel listings",
      });
    }

    const farmerId = farmerResult.rows[0].id;

    // 2. Check ownership and cancel listing
    const result = await pool.query(
      `UPDATE listings
       SET status = 'CANCELLED'
       WHERE id = $1
       AND farmer_id = $2
       AND status = 'ACTIVE'
       RETURNING *`,
      [listingId, farmerId]
    );

    if (result.rows.length === 0) {
      // Check if listing exists to give a better error
      const listingCheck = await pool.query(
        `SELECT id, farmer_id, status
         FROM listings
         WHERE id = $1`,
        [listingId]
      );

      if (listingCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Listing not found",
        });
      }

      if (listingCheck.rows[0].farmer_id !== farmerId) {
        return res.status(403).json({
          message: "You can only cancel your own listings",
        });
      }

      return res.status(400).json({
        message: "Only active listings can be cancelled",
      });
    }

    return res.status(200).json({
      message: "Listing cancelled successfully",
      listing: result.rows[0],
    });
  } catch (error) {
    console.error("Delete listing error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


// ----------------------------------------------------
// Export controllers
// ----------------------------------------------------
module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
};