const CLASS_MAP = {
  Active: "active",
  "Sold Out": "soldout",
  Placed: "placed",
  Confirmed: "confirmed",
  "In Transit": "intransit",
  Delivered: "delivered",
  Assigned: "assigned",
  "Picked Up": "pickedup",
  Cancelled: "cancelled",
};

export default function StatusBadge({ status }) {
  const key = CLASS_MAP[status] || "placed";
  return (
    <span className={`kd-badge kd-badge--${key}`}>
      <span className="kd-badge__dot" />
      {status}
    </span>
  );
}
