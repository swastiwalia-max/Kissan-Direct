import { useState } from "react";
import { Package } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import OrderCard from "../components/OrderCard.jsx";
import { FARMER_ORDERS } from "../data/mockData.js";

const FILTERS = ["All", "Placed", "Confirmed", "In Transit", "Delivered"];

export default function FarmerOrders() {
  const [filter, setFilter] = useState("All");
  const orders = filter === "All" ? FARMER_ORDERS : FARMER_ORDERS.filter((o) => o.status === filter);

  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <span className="kd-eyebrow">Farmer · Sales</span>
        <h1 className="kd-display-2 kd-mt-sm">Orders</h1>
        <p className="kd-body-muted kd-mt-sm">Track every order placed against your listings, from confirmation to delivery.</p>

        <div className="kd-filter-bar kd-mt-lg">
          {FILTERS.map((f) => (
            <button key={f} className={`kd-chip ${filter === f ? "kd-chip--active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="kd-empty-state">
            <Package />
            <p>No orders in this stage yet.</p>
          </div>
        ) : (
          <div className="kd-grid kd-grid--2">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} party={o.buyer} partyLabel="Buyer" showProgress />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
