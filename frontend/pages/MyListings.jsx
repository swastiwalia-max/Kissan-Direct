import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, PlusCircle, Sprout } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/Button.jsx";
import Field from "../components/Input.jsx";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { LISTINGS } from "../data/mockData.js";

const STATUS_OPTIONS = ["ACTIVE", "SOLD_OUT", "EXPIRED", "CANCELLED"];

export default function MyListings() {
  const [listings, setListings] = useState(
    LISTINGS.map((l) => ({
      ...l,
      quantity_available: l.quantityRemaining,
      price_per_kg: l.pricePerKg,
      quality_grade: l.quality,
      available_from: l.availableDate,
      status: l.status.toUpperCase().replace(" ", "_"),
    }))
  );
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  function saveEdit(e) {
    e.preventDefault();
    setListings((rows) => rows.map((r) => (r.id === editing.id ? editing : r)));
    setEditing(null);
  }

  function confirmDelete() {
    setListings((rows) => rows.filter((r) => r.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <div className="kd-flex kd-flex--between kd-flex--wrap">
          <div>
            <span className="kd-eyebrow">Farmer · listings Table</span>
            <h1 className="kd-display-2 kd-mt-sm">Manage Listings</h1>
          </div>
          <Link to="/farmer/add-produce">
            <Button icon={PlusCircle}>Add Produce</Button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="kd-empty-state kd-mt-lg">
            <Sprout />
            <p>No listings present in the database.</p>
          </div>
        ) : (
          <div className="kd-flex kd-flex--gap-sm kd-mt-lg" style={{ flexDirection: "column", alignItems: "stretch" }}>
            {listings.map((l) => (
              <div key={l.id} className="kd-card kd-flex kd-flex--between kd-flex--wrap" style={{ gap: 16 }}>
                <div style={{ minWidth: 160 }}>
                  <div className="kd-heading" style={{ fontSize: "1.05rem" }}>
                    {l.product}
                  </div>
                  <span className="kd-body-muted" style={{ fontSize: "0.8rem" }}>
                    Available: {l.available_from ? new Date(l.available_from).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "N/A"}
                  </span>
                </div>
                <div className="kd-flex kd-flex--gap-md kd-flex--wrap" style={{ flex: 1 }}>
                  <Stat label="quantity_available" value={`${l.quantity_available} kg`} />
                  <Stat label="price_per_kg" value={`₹${l.price_per_kg}`} />
                  <Stat label="quality_grade" value={l.quality_grade || "—"} />
                  <StatusBadge status={l.status} />
                </div>
                <div className="kd-flex kd-flex--gap-sm">
                  <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing({ ...l })}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleting(l)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Update Listing Record">
        {editing && (
          <form onSubmit={saveEdit}>
            <div className="kd-grid kd-grid--2">
              <Field
                label="Quantity Available (quantity_available) *"
                type="number"
                step="0.01"
                min="0"
                value={editing.quantity_available}
                onChange={(e) => setEditing({ ...editing, quantity_available: Number(e.target.value) })}
                required
              />
              <Field
                label="Price Per Kg (price_per_kg) *"
                type="number"
                step="0.01"
                min="0"
                value={editing.price_per_kg}
                onChange={(e) => setEditing({ ...editing, price_per_kg: Number(e.target.value) })}
                required
              />
            </div>
            <div className="kd-grid kd-grid--2">
              <Field
                label="Quality Grade (quality_grade)"
                value={editing.quality_grade || ""}
                onChange={(e) => setEditing({ ...editing, quality_grade: e.target.value })}
              />
              <Field
                label="Available From (available_from)"
                type="date"
                value={editing.available_from || ""}
                onChange={(e) => setEditing({ ...editing, available_from: e.target.value })}
              />
            </div>
            <Field
              label="Status (status) *"
              as="select"
              value={editing.status}
              options={STATUS_OPTIONS}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              required
            />
            <Button type="submit" full className="kd-mt-sm">
              Update Database
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Record?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="kd-body-muted">
          Listing #{deleting?.id} will be permanently removed from the listings table.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ minWidth: 90 }}>
      <div className="kd-body-muted" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, color: "var(--soil-brown)" }}>{value}</div>
    </div>
  );
}