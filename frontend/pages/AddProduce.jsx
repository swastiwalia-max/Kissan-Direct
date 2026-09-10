import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, PackagePlus } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Field from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import { LeafIcon, MustardIcon } from "../components/CropDecorations.jsx";

// Maps to products table mock list
const PRODUCTS_MOCK = [
  { id: 1, name: "Wheat" },
  { id: 2, name: "Rice" },
  { id: 3, name: "Tomato" },
  { id: 4, name: "Potato" },
  { id: 5, name: "Onion" },
  { id: 6, name: "Mustard" },
  { id: 7, name: "Maize" },
  { id: 8, name: "Sugarcane" },
  { id: 9, name: "Cotton" },
];

export default function AddProduce() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    product_id: PRODUCTS_MOCK[0].id,
    quantity_available: "",
    price_per_kg: "",
    quality_grade: "Grade A",
    available_from: new Date().toISOString().split("T")[0],
  });
  const [submitted, setSubmitted] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => navigate("/farmer/listings"), 1400);
  }

  return (
    <div>
      <Navbar />
      <main className="kd-page kd-page--narrow" style={{ position: "relative" }}>
        <LeafIcon style={{ position: "absolute", top: -10, right: 10, width: 70, color: "var(--sprout-green)", opacity: 0.5 }} />
        <MustardIcon style={{ position: "absolute", bottom: 40, left: -20, width: 60, color: "var(--leaf-green)", opacity: 0.35 }} />

        <span className="kd-eyebrow">Farmer · Create Listing</span>
        <h1 className="kd-display-2 kd-mt-sm">Add produce listing</h1>
        <p className="kd-body-muted kd-mt-sm">Inserts a new record into the listings table.</p>

        {submitted && (
          <div className="kd-mt-md">
            <Alert type="success">Listing record saved to database. Redirecting…</Alert>
          </div>
        )}

        <form className="kd-card kd-mt-lg" onSubmit={handleSubmit}>
          <Field
            label="Product (product_id) *"
            as="select"
            value={form.product_id}
            onChange={(e) => update("product_id", Number(e.target.value))}
            options={PRODUCTS_MOCK.map((p) => ({ value: p.id, label: p.name }))}
            required
          />

          <div className="kd-grid kd-grid--2">
            <Field
              label="Quantity Available (kg) *"
              type="number"
              step="0.01"
              min="0"
              placeholder="500.00"
              value={form.quantity_available}
              onChange={(e) => update("quantity_available", e.target.value)}
              required
            />
            <Field
              label="Price per kg (₹) *"
              type="number"
              step="0.01"
              min="0"
              placeholder="28.00"
              value={form.price_per_kg}
              onChange={(e) => update("price_per_kg", e.target.value)}
              required
            />
          </div>

          <div className="kd-grid kd-grid--2">
            <Field
              label="Quality Grade"
              placeholder="e.g. Grade A, Grade B"
              value={form.quality_grade}
              onChange={(e) => update("quality_grade", e.target.value)}
            />
            <Field
              label="Available From (DATE)"
              type="date"
              value={form.available_from}
              onChange={(e) => update("available_from", e.target.value)}
            />
          </div>

          <div className="kd-flex kd-flex--gap-sm kd-mt-sm">
            <Sprout size={16} color="var(--leaf-green)" />
            <span className="kd-body-muted" style={{ fontSize: "0.82rem" }}>
              Status will default to ACTIVE upon submission.
            </span>
          </div>

          <Button type="submit" icon={PackagePlus} full className="kd-mt-md">
            Publish Listing
          </Button>
        </form>
      </main>
    </div>
  );
}