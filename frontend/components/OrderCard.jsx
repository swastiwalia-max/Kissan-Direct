import StatusBadge from "./StatusBadge";

const ORDER_FLOW = ["Placed", "Confirmed", "In Transit", "Delivered"];

/**
 * order: { id, product, quantity, unit, amount, date, status, ...extra }
 * `party` is the label for the counterpart (buyer name on a farmer's order,
 * farmer name on a buyer's order). Set `showProgress` to render the track.
 */
export default function OrderCard({ order, party, partyLabel = "With", showProgress = false, children }) {
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  return (
    <div className="kd-card kd-order-card">
      <div className="kd-order-card__top">
        <div>
          <div className="kd-order-card__id">{order.id}</div>
          <div className="kd-order-card__product">{order.product}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <dl className="kd-order-card__grid">
        <div>
          <dt>{partyLabel}</dt>
          <dd>{party}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>
            {order.quantity} {order.unit}
          </dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>₹{order.amount.toLocaleString("en-IN")}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</dd>
        </div>
      </dl>

      {showProgress && currentIndex >= 0 && (
        <div className="kd-progress kd-mt-sm">
          {ORDER_FLOW.map((step, i) => (
            <div key={step} className={`kd-progress__step ${i <= currentIndex ? "kd-progress__step--done" : ""}`}>
              <div className="kd-progress__line" />
              <div className="kd-progress__dot" />
              <span className="kd-progress__label">{step}</span>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
