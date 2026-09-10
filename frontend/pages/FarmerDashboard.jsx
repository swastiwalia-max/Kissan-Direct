import { Link } from "react-router-dom";
import { PlusCircle, Package, Wallet, Sprout, TrendingUp, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import OrderCard from "../components/OrderCard.jsx";
import { WheatIcon } from "../components/CropDecorations.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LISTINGS, FARMER_ORDERS, CURRENT_FARMER } from "../data/mockData.js";

export default function FarmerDashboard() {
  const { user } = useAuth();
  const activeListings = LISTINGS.filter((l) => l.status === "Active");
  const totalEarnings = FARMER_ORDERS.filter((o) => o.status === "Delivered").reduce((sum, o) => sum + o.amount, 0);
  const openOrders = FARMER_ORDERS.filter((o) => o.status !== "Delivered").length;

  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <WheatIcon
          style={{
            position: "absolute",
            top: -20,
            right: 20,
            width: 130,
            color: "var(--leaf-green)",
            opacity: 0.1,
            pointerEvents: "none",
          }}
        />
        <WheatIcon
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            width: 90,
            color: "var(--mustard)",
            opacity: 0.08,
            pointerEvents: "none",
            transform: "rotate(14deg)",
          }}
        />

        <div className="kd-flex kd-flex--between kd-flex--wrap" style={{ position: "relative" }}>
          <div>
            <span className="kd-eyebrow">Namaste, {user?.name?.split(" ")[0] || CURRENT_FARMER.name.split(" ")[0]}</span>
            <h1 className="kd-display-2 kd-mt-sm">{user?.detail || CURRENT_FARMER.farmName}</h1>
            <p className="kd-body-muted kd-mt-sm">
              <Sprout size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> {CURRENT_FARMER.village}
            </p>
          </div>
          <Link to="/farmer/add-produce">
            <Button icon={PlusCircle}>Add Produce</Button>
          </Link>
        </div>

        <div className="kd-grid kd-grid--stats kd-mt-lg" style={{ position: "relative" }}>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Total Listings</span>
            <span className="kd-stat-card__value">{LISTINGS.length}</span>
            <span className="kd-stat-card__meta">{activeListings.length} active</span>
            <Package className="kd-card__watermark" />
          </div>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Active Produce</span>
            <span className="kd-stat-card__value">{activeListings.reduce((s, l) => s + l.quantityRemaining, 0)} kg</span>
            <span className="kd-stat-card__meta">Across {activeListings.length} listings</span>
            <Sprout className="kd-card__watermark" />
          </div>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Orders</span>
            <span className="kd-stat-card__value">{FARMER_ORDERS.length}</span>
            <span className="kd-stat-card__meta">{openOrders} in progress</span>
            <Package className="kd-card__watermark" />
          </div>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Earnings</span>
            <span className="kd-stat-card__value">₹{totalEarnings.toLocaleString("en-IN")}</span>
            <span className="kd-stat-card__meta">
              <TrendingUp size={12} style={{ display: "inline", verticalAlign: "-1px" }} /> From delivered orders
            </span>
            <Wallet className="kd-card__watermark" />
          </div>
        </div>

        <div className="kd-field-divider" />

        <div className="kd-grid kd-grid--2">
          <section>
            <div className="kd-flex kd-flex--between">
              <h2 className="kd-heading">Recent listings</h2>
              <Link to="/farmer/listings" className="kd-navlink" style={{ padding: 0, color: "var(--leaf-green)" }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="kd-flex kd-flex--gap-sm" style={{ flexDirection: "column", alignItems: "stretch", marginTop: 12 }}>
              {LISTINGS.slice(0, 3).map((l) => (
                <div key={l.id} className="kd-card kd-flex kd-flex--between">
                  <div>
                    <div className="kd-heading" style={{ fontSize: "1rem" }}>
                      {l.product}
                    </div>
                    <span className="kd-body-muted" style={{ fontSize: "0.82rem" }}>
                      {l.quantityRemaining} {l.unit} left · ₹{l.pricePerKg}/{l.unit}
                    </span>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="kd-flex kd-flex--between">
              <h2 className="kd-heading">Recent orders</h2>
              <Link to="/farmer/orders" className="kd-navlink" style={{ padding: 0, color: "var(--leaf-green)" }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="kd-flex kd-flex--gap-sm" style={{ flexDirection: "column", alignItems: "stretch", marginTop: 12 }}>
              {FARMER_ORDERS.slice(0, 2).map((o) => (
                <OrderCard key={o.id} order={o} party={o.buyer} partyLabel="Buyer" />
              ))}
            </div>
          </section>
        </div>

        <div className="kd-card kd-mt-lg" style={{ background: "var(--paper)", border: "none" }}>
          <div className="kd-flex kd-flex--gap-sm">
            <TrendingUp size={18} color="var(--forest-green)" />
            <h3 className="kd-heading" style={{ fontSize: "1rem" }}>
              Market insight
            </h3>
          </div>
          <p className="kd-body-muted kd-mt-sm">
            Wheat prices near Karnal are trending 6% higher than last month. Consider listing your remaining stock
            while demand is strong.
          </p>
        </div>
      </main>
    </div>
  );
}
