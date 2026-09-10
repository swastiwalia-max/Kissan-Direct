import { Link, useNavigate } from "react-router-dom";
import { Truck, MapPin, PackageCheck, Navigation, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { LeafIcon } from "../components/CropDecorations.jsx";
import { DRIVER_DELIVERIES, CURRENT_DRIVER } from "../data/mockData.js";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const current = DRIVER_DELIVERIES.find((d) => d.status === "In Transit") || DRIVER_DELIVERIES.find((d) => d.status === "Assigned");
  const today = DRIVER_DELIVERIES.filter((d) => d.status !== "Delivered");
  const completedCount = DRIVER_DELIVERIES.filter((d) => d.status === "Delivered").length;

  return (
    <div>
      <Navbar />
      <main className="kd-page" style={{ position: "relative", overflow: "hidden" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            height: 2,
            background: "repeating-linear-gradient(90deg, var(--earth-brown) 0 24px, transparent 24px 44px)",
            opacity: 0.15,
          }}
        />
        <LeafIcon style={{ position: "absolute", top: -10, right: 0, width: 70, color: "var(--sprout-green)", opacity: 0.3 }} />

        <div className="kd-flex kd-flex--between kd-flex--wrap">
          <div>
            <span className="kd-eyebrow">On the road, {CURRENT_DRIVER.name.split(" ")[0]}</span>
            <h1 className="kd-display-2 kd-mt-sm">Delivery dashboard</h1>
            <p className="kd-body-muted kd-mt-sm">
              <Truck size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> {CURRENT_DRIVER.vehicleType} · {CURRENT_DRIVER.vehicleNumber}
            </p>
          </div>
          {current && (
            <Button icon={Navigation} onClick={() => navigate(`/driver/delivery/${current.id}`)}>
              Open current delivery
            </Button>
          )}
        </div>

        <div className="kd-grid kd-grid--stats kd-mt-lg">
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Assigned Today</span>
            <span className="kd-stat-card__value">{today.length}</span>
            <PackageCheck className="kd-card__watermark" />
          </div>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Completed</span>
            <span className="kd-stat-card__value">{completedCount}</span>
            <PackageCheck className="kd-card__watermark" />
          </div>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Distance Today</span>
            <span className="kd-stat-card__value">{today.reduce((s, d) => s + d.distanceKm, 0)} km</span>
            <MapPin className="kd-card__watermark" />
          </div>
          <div className="kd-card kd-stat-card">
            <span className="kd-stat-card__label">Vehicle</span>
            <span className="kd-stat-card__value" style={{ fontSize: "1.1rem" }}>
              {CURRENT_DRIVER.vehicleNumber}
            </span>
            <Truck className="kd-card__watermark" />
          </div>
        </div>

        {current && (
          <div className="kd-card kd-mt-lg" style={{ borderColor: "var(--leaf-green)" }}>
            <div className="kd-flex kd-flex--between">
              <span className="kd-eyebrow">Current delivery — {current.id}</span>
              <StatusBadge status={current.status} />
            </div>
            <div className="kd-flex kd-flex--between kd-mt-sm kd-flex--wrap" style={{ gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--soil-brown)" }}>
                  {current.pickup.location} <ArrowRight size={13} style={{ display: "inline", verticalAlign: "-2px", margin: "0 4px" }} /> {current.drop.location}
                </div>
                <span className="kd-body-muted" style={{ fontSize: "0.85rem" }}>
                  {current.product} · {current.quantity} {current.unit} · {current.distanceKm} km · ETA {current.etaMinutes} min
                </span>
              </div>
              <Link to={`/driver/delivery/${current.id}`}>
                <Button variant="secondary">View details</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="kd-flex kd-flex--between kd-mt-lg">
          <h2 className="kd-heading">Today's deliveries</h2>
          <Link to="/driver/route" className="kd-navlink" style={{ padding: 0, color: "var(--leaf-green)" }}>
            View route <ArrowRight size={14} />
          </Link>
        </div>

        <div className="kd-flex kd-flex--gap-sm kd-mt-sm" style={{ flexDirection: "column", alignItems: "stretch" }}>
          {today.map((d) => (
            <Link key={d.id} to={`/driver/delivery/${d.id}`} className="kd-card kd-flex kd-flex--between kd-flex--wrap" style={{ gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--soil-brown)" }}>
                  {d.pickup.location} → {d.drop.location}
                </div>
                <span className="kd-body-muted" style={{ fontSize: "0.82rem" }}>
                  {d.product} · {d.quantity} {d.unit} · Order {d.orderId}
                </span>
              </div>
              <StatusBadge status={d.status} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
