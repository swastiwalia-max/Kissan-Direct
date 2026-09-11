export const DRIVER_DELIVERIES = [
  {
    id: "DEL-001",
    orderId: "ORD-001",
    status: "Assigned",
    pickup: {
      name: "Ramesh Kumar Farm",
      location: "Rampur, Gautam Buddha Nagar"
    },
    drop: {
      name: "FreshMart",
      location: "Sector 18, Noida"
    },
    distanceKm: 18,
    etaMinutes: 45
  }
];

export const CURRENT_FARMER = {
  id: "USR-001",
  name: "Ramesh Kumar",
  email: "farmer@kissandirect.com",
  role: "FARMER"
};

export const CURRENT_BUYER = {
  id: "USR-002",
  name: "FreshMart Buyer",
  email: "buyer@kissandirect.com",
  role: "BUYER"
};

export const CURRENT_DRIVER = {
  id: "USR-003",
  name: "Amit Sharma",
  email: "driver@kissandirect.com",
  role: "DRIVER"
};
