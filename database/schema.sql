-- =========================================================
-- 1. USERS
-- =========================================================

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('FARMER', 'BUYER', 'DRIVER', 'ADMIN')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. FARMER PROFILES
-- =========================================================

CREATE TABLE farmer_profiles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER NOT NULL UNIQUE,

    village VARCHAR(100) NOT NULL,
    panchayat VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,

    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),

    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 3. BUYER PROFILES
-- =========================================================

CREATE TABLE buyer_profiles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER NOT NULL UNIQUE,

    business_name VARCHAR(150) NOT NULL,
    business_type VARCHAR(50),

    village VARCHAR(100),
    panchayat VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),

    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 4. DRIVER PROFILES
-- =========================================================

CREATE TABLE driver_profiles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER NOT NULL UNIQUE,

    vehicle_type VARCHAR(50),
    vehicle_number VARCHAR(30) UNIQUE,
    vehicle_capacity_kg NUMERIC(10,2),

    current_latitude NUMERIC(9,6),
    current_longitude NUMERIC(9,6),

    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'OFFLINE')),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 5. PRODUCTS
-- =========================================================

CREATE TABLE products (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg'
);


-- =========================================================
-- 6. LISTINGS
-- =========================================================

CREATE TABLE listings (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    farmer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,

    quantity_available NUMERIC(10,2) NOT NULL
        CHECK (quantity_available >= 0),

    price_per_kg NUMERIC(10,2) NOT NULL
        CHECK (price_per_kg >= 0),

    quality_grade VARCHAR(20),

    available_from DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SOLD_OUT', 'EXPIRED', 'CANCELLED')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id)
        REFERENCES farmer_profiles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 7. ORDERS
-- =========================================================

CREATE TABLE orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    buyer_id INTEGER NOT NULL,

    subtotal NUMERIC(12,2) NOT NULL
        CHECK (subtotal >= 0),

    logistics_cost NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (logistics_cost >= 0),

    total_amount NUMERIC(12,2) NOT NULL
        CHECK (total_amount >= 0),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
        CHECK (
            status IN (
                'PENDING_PAYMENT',
                'PLACED',
                'ACCEPTED',
                'DRIVER_ASSIGNED',
                'PICKED_UP',
                'IN_TRANSIT',
                'DELIVERED',
                'CANCELLED'
            )
        ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (buyer_id)
        REFERENCES buyer_profiles(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 8. ORDER ITEMS
-- =========================================================

CREATE TABLE order_items (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    order_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,

    quantity NUMERIC(10,2) NOT NULL
        CHECK (quantity > 0),

    price_per_kg NUMERIC(10,2) NOT NULL
        CHECK (price_per_kg >= 0),

    subtotal NUMERIC(12,2) NOT NULL
        CHECK (subtotal >= 0),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 9. DELIVERIES
-- =========================================================

CREATE TABLE deliveries (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    order_id INTEGER NOT NULL UNIQUE,
    driver_id INTEGER,

    pickup_latitude NUMERIC(9,6),
    pickup_longitude NUMERIC(9,6),

    drop_latitude NUMERIC(9,6),
    drop_longitude NUMERIC(9,6),

    assigned_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,

    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED'
        CHECK (
            status IN (
                'ASSIGNED',
                'PICKED_UP',
                'IN_TRANSIT',
                'DELIVERED',
                'CANCELLED'
            )
        ),

    delivery_otp VARCHAR(10),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (driver_id)
        REFERENCES driver_profiles(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 10. FORECASTS
-- Stores AI-generated recommendations for farmers
--
-- AI predicts:
-- 1. Expected demand
-- 2. Recommended selling price
-- 3. Estimated number of days to sell
-- =========================================================

CREATE TABLE forecasts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    product_id INTEGER NOT NULL,

    location VARCHAR(150) NOT NULL,

    forecast_date DATE NOT NULL,

    predicted_demand_kg NUMERIC(10,2),

    recommended_price_per_kg NUMERIC(10,2),

    estimated_sell_days INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 11. PAYMENTS
-- Simulated payment system for the MVP
-- =========================================================

CREATE TABLE payments (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    order_id INTEGER NOT NULL,

    amount NUMERIC(12,2) NOT NULL
        CHECK (amount >= 0),

    payment_method VARCHAR(30) NOT NULL DEFAULT 'DEMO',

    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            payment_status IN (
                'PENDING',
                'SUCCESS',
                'FAILED',
                'REFUNDED'
            )
        ),

    transaction_id VARCHAR(100) UNIQUE,

    paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_listings_farmer
    ON listings(farmer_id);

CREATE INDEX idx_listings_product
    ON listings(product_id);

CREATE INDEX idx_listings_status
    ON listings(status);

CREATE INDEX idx_orders_buyer
    ON orders(buyer_id);

CREATE INDEX idx_orders_status
    ON orders(status);

CREATE INDEX idx_order_items_order
    ON order_items(order_id);

CREATE INDEX idx_deliveries_driver
    ON deliveries(driver_id);

CREATE INDEX idx_deliveries_status
    ON deliveries(status);

CREATE INDEX idx_forecasts_product
    ON forecasts(product_id);

CREATE INDEX idx_forecasts_location
    ON forecasts(location);

CREATE INDEX idx_payments_order
    ON payments(order_id);

CREATE INDEX idx_payments_status
    ON payments(payment_status);