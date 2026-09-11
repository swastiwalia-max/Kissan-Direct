const express = require("express");

const {
    createListing,
    getListings,
    getListingById,
    updateListing,
    deleteListing
} = require("../controllers/listingController");

const router = express.Router();

// Create a new listing
router.post("/", createListing);

// Get all active listings
router.get("/", getListings);

// Get a single listing by ID
router.get("/:id", getListingById);

// Update a listing
router.put("/:id", updateListing);

// Cancel a listing
router.delete("/:id", deleteListing);

module.exports = router;