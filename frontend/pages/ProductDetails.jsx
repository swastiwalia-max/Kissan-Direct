import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, ShieldCheck, Minus, Plus, Sprout } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import { WheatIcon, MustardIcon, MaizeIcon, SugarcaneIcon } from "../components/CropDecorations.jsx";
import { MARKETPLACE_PRODUCTS } from "../data/mockData.js";

const ICON_MAP = { Wheat: WheatIcon, Mustard: MustardIcon, Maize: MaizeIcon, Sugarcane: SugarcaneIcon };

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = MARKETPLACE_PRODUCTS.find((p) => p.id === productId);

  const [quantity, setQuantity] = useState(product ? Math.min(10, product.quantityRemaining) : 1);
  const [placed, setPlaced] = useState(false);

  if (!product) {
    return (
      <div>
        <Navbar />
        <main className="kd-page kd-page--narrow">
          <div className="kd-empty-state">
            <Sprout />
            <p>Listing not found in database.</p>
            <Link to="/marketplace">
              <Button variant="secondary" className="kd-mt-sm">
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const Icon = ICON_MAP[product.product];
  const price_per_kg = product.pricePerKg;
  const subtotal = Number((quantity * price_per_kg).toFixed(2));
  const logistics_cost = 250.0; // simulated logistics_cost column
  const total_amount = Number((subtotal + logistics_cost).toFixed(2));

  function changeQty(delta) {
    setQuantity((q) => Math.max(1, Math.min(product.quantityRemaining, q + delta)));
  }

  function handleBuy(e) {
    e.preventDefault();
    setPlaced(true);
    // Persists order: orders (subtotal, logistics_cost, total_amount) & order_items (quantity, price_per_kg, subtotal)
    window.setTimeout(() => navigate("/buyer/orders"), 1400);
  }

  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <button className="kd-btn kd-btn--ghost kd-btn--sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="kd-grid kd-grid--2 kd-mt-md" style={{ alignItems: "start" }}>
          <div className="kd-card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                height: 280,
                background: "linear-gradient(135deg, #eaf1de 0%, #f4ecd8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Icon ? <Icon style={{ width: 140, height: 140, color: "var(--leaf-green)" }} /> : <Sprout size={100} color="var(--leaf-green)" />}
            </div>
          </div>

          <div>
            <span className="kd-badge kd-badge--active">
              <ShieldCheck size={12} /> {product.quality}
            </span>
            <h1 className="kd-display-2 kd-mt-sm">{product.product}</h1>
            <p className="kd-body-muted kd-mt-sm">
              <MapPin size={13} style={{ display: "inline", verticalAlign: "-2px" }} /> {product.location} · Farmer ID #{product.farmer}
            </p>

            <div className="kd-card kd-mt-md">
              <div className="kd-flex kd-flex--between">
                <span className="kd-body-muted">Price per kg</span>
                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>₹{price_per_kg.toFixed(2)}</span>
              </div>
              <div className="kd-flex kd-flex--between kd-mt-sm">
                <span className="kd-body-muted">Available stock</span>
                <span style={{ fontWeight: 700 }}>{product.quantityRemaining} kg</span>
              </div>
              <div className="kd-flex kd-flex--between kd-mt-sm">
                <span className="kd-body-muted">
                  <CalendarDays size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Available from
                </span>
                <span style={{ fontWeight: 700 }}>
                  {new Date(product.availableDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <form onSubmit={handleBuy} className="kd-card kd-mt-md">
              <span className="kd-field__label">Order Item: Quantity (kg)</span>
              <div className="kd-flex kd-flex--gap-sm kd-mt-sm">
                <Button variant="secondary" size="sm" onClick={() => changeQty(-5)} aria-label="Decrease quantity">
                  <Minus size={14} />
                </Button>
                <span style={{ fontWeight: 800, minWidth: 70, textAlign: "center" }}>{quantity} kg</span>
                <Button variant="secondary" size="sm" onClick={() => changeQty(5)} aria-label="Increase quantity">
                  <Plus size={14} />
                </Button>
              </div>

              <div className="kd-flex kd-flex--between kd-mt-md">
                <span className="kd-body-muted">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="kd-flex kd-flex--between kd-mt-xs">
                <span className="kd-body-muted">Logistics Cost</span>
                <span>₹{logistics_cost.toFixed(2)}</span>
              </div>
              <div className="kd-flex kd-flex--between kd-mt-sm" style={{ borderTop: "1px dashed rgba(60,42,31,0.2)", paddingTop: 8 }}>
                <span style={{ fontWeight: 700 }}>Total Amount</span>
                <span className="kd-display-2" style={{ fontSize: "1.4rem" }}>
                  ₹{total_amount.toFixed(2)}
                </span>
              </div>

              {placed && (
                <div className="kd-mt-sm">
                  <Alert type="success">Order record inserted. Navigating to orders…</Alert>
                </div>
              )}

              <Button type="submit" full className="kd-mt-md" disabled={placed}>
                {placed ? "Processing..." : "Place Order"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
