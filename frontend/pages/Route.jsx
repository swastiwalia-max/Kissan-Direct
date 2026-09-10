import { Navigation, Clock, MapPinned, Truck } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import { DRIVER_DELIVERIES } from "../data/mockData.js";

export default function RoutePage() {
  const active = DRIVER_DELIVERIES.find((d) => d.status !== "Delivered") || DRIVER_DELIVERIES[0];

  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <span className="kd-eyebrow">Driver · Navigation</span>
        <h1 className="kd-display-2 kd-mt-sm">Today's route</h1>
        <p className="kd-body-muted kd-mt-sm">
          Delivery {active.id} for order {active.orderId}
        </p>

        <div className="kd-route-map kd-mt-lg">
          <svg viewBox="0 0 400 260" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
            <path
              d="M60 40 C 40 100, 140 90, 130 150 S 260 200, 340 220"
              fill="none"
              stroke="var(--forest-green)"
              strokeWidth="3"
              strokeDasharray="1 12"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>

          <div style={{ position: "absolute", top: 22, left: 40 }}>
            <MarkerLabel color="var(--leaf-green)" title="Farm" subtitle={active.pickup.location} />
          </div>
          <div style={{ position: "absolute", bottom: 24, right: 30 }}>
            <MarkerLabel color="var(--terracotta)" title="Buyer" subtitle={active.drop.location} />
          </div>
          <div style={{ position: "absolute", top: "48%", left: "40%" }} className="kd-loading__truck">
            <Truck size={28} color="var(--forest-green-dark)" fill="var(--mustard-light)" />
          </div>
        </div>

        <div className="kd-grid kd-grid--2 kd-mt-lg">
          <div className="kd-card">
            <span className="kd-body-muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
              DISTANCE
            </span>
            <div className="kd-flex kd-flex--gap-sm kd-mt-sm">
              <MapPinned size={18} color="var(--leaf-green)" />
              <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>{active.distanceKm} km</span>
            </div>
          </div>
          <div className="kd-card">
            <span className="kd-body-muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
              ESTIMATED TIME
            </span>
            <div className="kd-flex kd-flex--gap-sm kd-mt-sm">
              <Clock size={18} color="var(--leaf-green)" />
              <span style={{ fontWeight: 800, fontSize: "1.2rem" }}>{Math.round(active.etaMinutes / 60)} hr {active.etaMinutes % 60} min</span>
            </div>
          </div>
        </div>

        <div className="kd-card kd-mt-md">
          <div className="kd-flex kd-flex--between">
            <div>
              <span className="kd-body-muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                PICKUP
              </span>
              <div style={{ fontWeight: 700 }}>{active.pickup.name}, {active.pickup.location}</div>
            </div>
          </div>
          <div className="kd-flex kd-flex--between kd-mt-sm">
            <div>
              <span className="kd-body-muted" style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                DROP
              </span>
              <div style={{ fontWeight: 700 }}>{active.drop.name}, {active.drop.location}</div>
            </div>
          </div>
          <Button full icon={Navigation} className="kd-mt-md">
            Start navigation
          </Button>
        </div>
      </main>
    </div>
  );
}

function MarkerLabel({ color, title, subtitle }) {
  return (
    <div className="kd-flex kd-flex--gap-sm">
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, boxShadow: "0 0 0 4px rgba(0,0,0,0.05)" }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{title}</div>
        <div className="kd-body-muted" style={{ fontSize: "0.76rem" }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
