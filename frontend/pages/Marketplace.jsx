import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBasket } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { LeafIcon } from "../components/CropDecorations.jsx";
import { MARKETPLACE_PRODUCTS } from "../data/mockData.js";

const CATEGORIES = ["All", "Wheat", "Rice", "Tomato", "Potato", "Onion", "Mustard", "Maize", "Sugarcane", "Cotton"];
const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("relevance");

  const products = useMemo(() => {
    let list = MARKETPLACE_PRODUCTS.filter((p) => p.quantityRemaining > 0);
    if (category !== "All") {
      list = list.filter((p) => p.product.toLowerCase().includes(category.toLowerCase()));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.product.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.farmer.toLowerCase().includes(q));
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.pricePerKg - b.pricePerKg);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.pricePerKg - a.pricePerKg);
    return list;
  }, [query, category, sort]);

  return (
    <div>
      <Navbar />
      <main className="kd-page">
        <div className="kd-flex kd-flex--between kd-flex--wrap">
          <div>
            <span className="kd-eyebrow">Marketplace</span>
            <h1 className="kd-display-2 kd-mt-sm">Fresh from Indian farms</h1>
            <p className="kd-body-muted kd-mt-sm">Buy produce directly from verified farmers — transparent prices, no middlemen.</p>
          </div>
          <LeafIcon style={{ width: 54, color: "var(--sprout-green)", opacity: 0.7 }} />
        </div>

        <div className="kd-filter-bar kd-mt-lg">
          <div className="kd-input-wrap" style={{ flex: "1 1 220px" }}>
            <Search size={16} className="kd-input-wrap__icon" />
            <input
              className="kd-input"
              placeholder="Search produce, farmer or location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="kd-select" style={{ width: 190 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="kd-flex kd-flex--gap-sm kd-flex--wrap kd-mt-sm">
          {CATEGORIES.map((c) => (
            <button key={c} className={`kd-chip ${category === c ? "kd-chip--active" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="kd-empty-state">
            <ShoppingBasket />
            <p>No produce matches your search right now.</p>
          </div>
        ) : (
          <div className="kd-grid kd-grid--products kd-mt-lg">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onView={(prod) => navigate(`/marketplace/${prod.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
