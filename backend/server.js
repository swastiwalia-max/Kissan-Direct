const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Listing routes
const listingRoutes = require("./routes/listingRoutes");
app.use("/api/listings", listingRoutes);

// Order routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Kissan-Direct API is running"
    });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend is healthy"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Kissan-Direct server running on port ${PORT}`);
});
