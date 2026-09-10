import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User, Phone, KeyRound, Package } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Field from "../components/Input.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Alert from "../components/Alert.jsx";
import { DRIVER_DELIVERIES } from "../data/mockData.js";

// Exact CHECK constraint for deliveries.status
const DELIVERY_STATUS_FLOW = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export default function DeliveryDetails() {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const base = DRIVER_DELIVERIES.find((d) => d.id === deliveryId);

  const [status, setStatus] = useState(
    base ? base.status.toUpperCase().replace(" ", "_") : "ASSIGNED"
  );
  const [enteredOtp, setEnteredOtp] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!base) {
    return (
      <div>
        <Navbar />
        <main className="kd-page kd-page--narrow">
          <div className="kd-empty-state">
            <Package />
            <p>Delivery record not found in deliveries table.</p>
          </div>
        </main>
      </div>
    );
  }

  const currentIndex = DELIVERY_STATUS_FLOW.indexOf(status);
  const nextStatus = DELIVERY_STATUS_FLOW[currentIndex + 1];

  function handleStatusUpdate() {
    setError("");

    // If next transition is DELIVERED, verify delivery_otp
    if (nextStatus === "DELIVERED") {
      if (enteredOtp.trim() !== base.otp) {
        setError("Invalid OTP. Handover cannot be completed without buyer delivery_otp.");
        return;
      }
    }

    setStatus(nextStatus);
    setSuccessMsg(`deliveries.status updated to ${nextStatus}`);
  }

  return (
    <div>
      <Navbar />
      <main className="kd-page kd-page--narrow">
        <button className="kd-btn kd-btn--ghost kd-btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="kd-flex kd-flex--between kd-mt-sm">
          <div>
            <span className="kd-eyebrow">deliveries.id: {base.id} · order_id: {base.orderId}</span>
            <h1 className="kd-display-2 kd-mt-sm" style={{ fontSize: "1.8rem" }}>
              {base.product} · {base.quantity} {base.unit}
            </h1>
          </div>
          <StatusBadge status={status} />
        </div>

        {error && (
          <div className="kd-mt-sm">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {successMsg && (
          <div className="kd-mt-sm">
            <Alert type="success">{successMsg}</Alert>
          </div>
        )}

        <div className="kd-card kd-mt-lg">
          <div className="kd-flex kd-flex--gap-sm">
            <MapPin size={16} color="var(--leaf-green)" />
            <div>
              <div className="kd-body-muted" style={{ fontSize: "0.76rem", fontWeight: 700 }}>
                PICKUP (pickup_latitude, pickup_longitude)
              </div>
              <div style={{ fontWeight: 700 }}>{base.pickup.name}</div>
              <div className="kd-body-muted" style={{ fontSize: "0.85rem" }}>
                {base.pickup.location}
              </div>
            </div>
          </div>
          <div className="kd-mt-sm" style={{ borderLeft: "2px dashed rgba(60,42,31,0.2)", height: 18, marginLeft: 8 }} />
          <div className="kd-flex kd-flex--gap-sm">
            <MapPin size={16} color="var(--terracotta)" />
            <div>
              <div className="kd-body-muted" style={{ fontSize: "0.76rem", fontWeight: 700 }}>
                DROP (drop_latitude, drop_longitude)
              </div>
              <div style={{ fontWeight: 700 }}>{base.drop.name}</div>
              <div className="kd-body-muted" style={{ fontSize: "0.85rem" }}>
                {base.drop.location}
              </div>
            </div>
          </div>
        </div>

        <div className="kd-grid kd-grid--2 kd-mt-md">
          <div className="kd-card">
            <div className="kd-flex kd-flex--gap-sm">
              <User size={16} color="var(--forest-green)" />
              <span style={{ fontWeight: 700 }}>Farmer</span>
            </div>
            <p className="kd-mt-sm" style={{ fontWeight: 700 }}>
              {base.farmer.name}
            </p>
            <a href={`tel:${base.farmer.phone.replace(/\s/g, "")}`} className="kd-btn kd-btn--secondary kd-btn--sm kd-mt-sm">
              <Phone size={13} /> {base.farmer.phone}
            </a>
          </div>
          <div className="kd-card">
            <div className="kd-flex kd-flex--gap-sm">
              <User size={16} color="var(--mustard)" />
              <span style={{ fontWeight: 700 }}>Buyer</span>
            </div>
            <p className="kd-mt-sm" style={{ fontWeight: 700 }}>
              {base.buyer.name}
            </p>
            <a href={`tel:${base.buyer.phone.replace(/\s/g, "")}`} className="kd-btn kd-btn--secondary kd-btn--sm kd-mt-sm">
              <Phone size={13} /> {base.buyer.phone}
            </a>
          </div>
        </div>

        {status === "IN_TRANSIT" && (
          <div className="kd-card kd-mt-md">
            <div className="kd-flex kd-flex--gap-sm">
              <KeyRound size={16} color="var(--forest-green)" />
              <span style={{ fontWeight: 700 }}>Verify delivery_otp</span>
            </div>
            <p className="kd-body-muted kd-mt-sm" style={{ fontSize: "0.82rem" }}>
              Enter the OTP provided by the buyer to complete delivery.
            </p>
            <Field
              type="text"
              placeholder="Enter 4-digit OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              maxLength={10}
            />
          </div>
        )}

        {status === "DELIVERED" ? (
          <div className="kd-mt-md">
            <Alert type="success">Delivery status is marked as DELIVERED (delivered_at set).</Alert>
          </div>
        ) : (
          <Button full className="kd-mt-md" onClick={handleStatusUpdate}>
            Transition Status to {nextStatus}
          </Button>
        )}
      </main>
    </div>
  );
}
