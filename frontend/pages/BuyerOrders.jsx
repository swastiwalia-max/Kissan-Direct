import { ShoppingBag, Truck, Phone } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import OrderCard from "../components/OrderCard.jsx";
import { BUYER_ORDERS } from "../data/mockData.js";

export default function BuyerOrders() {
  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <span className="kd-eyebrow">Buyer · Purchases</span>
        <h1 className="kd-display-2 kd-mt-sm">My Orders</h1>
        <p className="kd-body-muted kd-mt-sm">Every order you've placed, with live delivery status.</p>

        {BUYER_ORDERS.length === 0 ? (
          <div className="kd-empty-state">
            <ShoppingBag />
            <p>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="kd-grid kd-grid--2 kd-mt-lg">
            {BUYER_ORDERS.map((o) => (
              <OrderCard key={o.id} order={o} party={o.farmer} partyLabel="Farmer" showProgress>
                {o.driver && (
                  <div className="kd-flex kd-flex--between kd-mt-sm" style={{ borderTop: "1px dashed rgba(60,42,31,0.15)", paddingTop: 10 }}>
                    <span className="kd-flex kd-flex--gap-sm" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--soil-brown)" }}>
                      <Truck size={15} color="var(--leaf-green)" /> {o.driver.name} · {o.driver.vehicle}
                    </span>
                    <a href={`tel:${o.driver.phone.replace(/\s/g, "")}`} className="kd-btn kd-btn--ghost kd-btn--sm">
                      <Phone size={14} />
                    </a>
                  </div>
                )}
              </OrderCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
