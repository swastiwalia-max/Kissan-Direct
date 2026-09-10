import { MapPin, Sprout } from "lucide-react";
import { WheatIcon, MustardIcon, MaizeIcon, SugarcaneIcon, LeafIcon } from "./CropDecorations";
import Button from "./Button";

const ICON_MAP = {
  Wheat: WheatIcon,
  Mustard: MustardIcon,
  Maize: MaizeIcon,
  Sugarcane: SugarcaneIcon,
};

function iconFor(product) {
  return ICON_MAP[product] || null;
}

/**
 * product: { id, product, pricePerKg, unit, quality, quantityRemaining,
 *            farmer, location, availableDate }
 */
export default function ProductCard({ product, onView, onAdd }) {
  const Icon = iconFor(product.product);
  return (
    <div className="kd-product-card">
      <div
        className="kd-product-card__media"
        onClick={() => onView?.(product)}
        style={{ cursor: onView ? "pointer" : "default" }}
      >
        <span className="kd-product-card__grade">
          <span className="kd-badge kd-badge--active">{product.quality}</span>
        </span>
        {Icon ? <Icon style={{ width: 56, height: 56 }} /> : <Sprout size={48} color="var(--leaf-green)" />}
      </div>
      <div className="kd-product-card__body">
        <span
          className="kd-product-card__name"
          onClick={() => onView?.(product)}
          style={{ cursor: onView ? "pointer" : "default" }}
        >
          {product.product}
        </span>
        <span className="kd-product-card__meta">
          <MapPin size={13} /> {product.location}
        </span>
        <span className="kd-product-card__meta">{product.farmer}</span>
        <div className="kd-product-card__footer">
          <span className="kd-product-card__price">
            ₹{product.pricePerKg} <span>/ {product.unit}</span>
          </span>
          <Button size="sm" variant="primary" onClick={() => (onAdd ? onAdd(product) : onView?.(product))}>
            {onAdd ? "Add" : "View"}
          </Button>
        </div>
        <span className="kd-body-muted" style={{ fontSize: "0.76rem" }}>
          {product.quantityRemaining} {product.unit} available
        </span>
      </div>
    </div>
  );
}
