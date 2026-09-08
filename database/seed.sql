-- =========================================================
-- 1. USERS
-- =========================================================

INSERT INTO users
(name, email, phone, password_hash, role)
VALUES
('Ramesh Kumar', 'farmer@kissan.com', '9876543210', 'demo_hash_farmer', 'FARMER'),
('Anita Sharma', 'buyer@kissan.com', '9876543211', 'demo_hash_buyer', 'BUYER'),
('Vikram Singh', 'driver@kissan.com', '9876543212', 'demo_hash_driver', 'DRIVER'),
('Kissan Admin', 'admin@kissan.com', '9876543213', 'demo_hash_admin', 'ADMIN');


-- =========================================================
-- 2. FARMER PROFILES
-- =========================================================

INSERT INTO farmer_profiles
(user_id, village, panchayat, district, state,
 latitude, longitude, verification_status)
VALUES
(
    (SELECT id FROM users WHERE email = 'farmer@kissan.com'),
    'Rampur',
    'Rampur Panchayat',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    28.474400,
    77.504000,
    'VERIFIED'
);


-- =========================================================
-- 3. BUYER PROFILES
-- =========================================================

INSERT INTO buyer_profiles
(user_id, business_name, business_type,
 village, panchayat, district, state,
 latitude, longitude)
VALUES
(
    (SELECT id FROM users WHERE email = 'buyer@kissan.com'),
    'FreshMart',
    'Retailer',
    'Noida',
    'Sector 18',
    'Gautam Buddha Nagar',
    'Uttar Pradesh',
    28.570600,
    77.321900
);


-- =========================================================
-- 4. DRIVER PROFILES
-- =========================================================

INSERT INTO driver_profiles
(user_id, vehicle_type, vehicle_number,
 vehicle_capacity_kg,
 current_latitude, current_longitude,
 availability_status)
VALUES
(
    (SELECT id FROM users WHERE email = 'driver@kissan.com'),
    'Mini Truck',
    'UP16AB1234',
    1000,
    28.535500,
    77.391000,
    'AVAILABLE'
);


-- =========================================================
-- 5. PRODUCTS
-- =========================================================

INSERT INTO products
(name, category, unit)
VALUES
('Tomato', 'Vegetable', 'kg'),
('Potato', 'Vegetable', 'kg'),
('Onion', 'Vegetable', 'kg');


-- =========================================================
-- 6. LISTINGS
-- =========================================================

INSERT INTO listings
(farmer_id, product_id,
 quantity_available, price_per_kg,
 quality_grade, available_from, status)
VALUES
(
    (
        SELECT fp.id
        FROM farmer_profiles fp
        JOIN users u ON u.id = fp.user_id
        WHERE u.email = 'farmer@kissan.com'
    ),
    (SELECT id FROM products WHERE name = 'Tomato'),
    500,
    24,
    'A',
    CURRENT_DATE,
    'ACTIVE'
),
(
    (
        SELECT fp.id
        FROM farmer_profiles fp
        JOIN users u ON u.id = fp.user_id
        WHERE u.email = 'farmer@kissan.com'
    ),
    (SELECT id FROM products WHERE name = 'Potato'),
    300,
    20,
    'A',
    CURRENT_DATE,
    'ACTIVE'
),
(
    (
        SELECT fp.id
        FROM farmer_profiles fp
        JOIN users u ON u.id = fp.user_id
        WHERE u.email = 'farmer@kissan.com'
    ),
    (SELECT id FROM products WHERE name = 'Onion'),
    250,
    28,
    'B',
    CURRENT_DATE,
    'ACTIVE'
);


-- =========================================================
-- 7. ORDERS
-- =========================================================

INSERT INTO orders
(buyer_id, subtotal, logistics_cost, total_amount, status)
VALUES
(
    (
        SELECT bp.id
        FROM buyer_profiles bp
        JOIN users u ON u.id = bp.user_id
        WHERE u.email = 'buyer@kissan.com'
    ),
    2400,
    300,
    2700,
    'DRIVER_ASSIGNED'
);


-- =========================================================
-- 8. ORDER ITEMS
-- =========================================================

INSERT INTO order_items
(order_id, listing_id, quantity, price_per_kg, subtotal)
VALUES
(
    (SELECT id FROM orders ORDER BY id DESC LIMIT 1),
    (
        SELECT l.id
        FROM listings l
        JOIN products p ON p.id = l.product_id
        WHERE p.name = 'Tomato'
        ORDER BY l.id DESC
        LIMIT 1
    ),
    100,
    24,
    2400
);


-- =========================================================
-- 9. DELIVERIES
-- =========================================================

INSERT INTO deliveries
(order_id, driver_id,
 pickup_latitude, pickup_longitude,
 drop_latitude, drop_longitude,
 assigned_at,
 status,
 delivery_otp)
VALUES
(
    (SELECT id FROM orders ORDER BY id DESC LIMIT 1),

    (
        SELECT dp.id
        FROM driver_profiles dp
        JOIN users u ON u.id = dp.user_id
        WHERE u.email = 'driver@kissan.com'
    ),

    28.474400,
    77.504000,

    28.570600,
    77.321900,

    CURRENT_TIMESTAMP,

    'ASSIGNED',

    '4821'
);


-- =========================================================
-- 10. FORECASTS
-- =========================================================

INSERT INTO forecasts
(product_id, location, forecast_date,
 predicted_demand_kg,
 recommended_price_per_kg,
 estimated_sell_days)
VALUES
(
    (SELECT id FROM products WHERE name = 'Tomato'),
    'Gautam Buddha Nagar',
    CURRENT_DATE,
    450,
    24,
    3
),
(
    (SELECT id FROM products WHERE name = 'Potato'),
    'Gautam Buddha Nagar',
    CURRENT_DATE,
    350,
    21,
    4
),
(
    (SELECT id FROM products WHERE name = 'Onion'),
    'Gautam Buddha Nagar',
    CURRENT_DATE,
    280,
    29,
    5
);


-- =========================================================
-- 11. PAYMENTS
-- =========================================================

INSERT INTO payments
(order_id, amount, payment_method,
 payment_status, transaction_id, paid_at)
VALUES
(
    (SELECT id FROM orders ORDER BY id DESC LIMIT 1),
    2700,
    'DEMO',
    'SUCCESS',
    'DEMO-TXN-001',
    CURRENT_TIMESTAMP
);