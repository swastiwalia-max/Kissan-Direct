import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sprout,
  LayoutGrid,
  PlusCircle,
  ListChecks,
  Package,
  Store,
  ShoppingBag,
  Truck,
  Route as RouteIcon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_BY_ROLE = {
  farmer: [
    { to: "/farmer/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/farmer/add-produce", label: "Add Produce", icon: PlusCircle },
    { to: "/farmer/listings", label: "My Listings", icon: ListChecks },
    { to: "/farmer/orders", label: "Orders", icon: Package },
  ],
  buyer: [
    { to: "/marketplace", label: "Marketplace", icon: Store },
    { to: "/buyer/orders", label: "My Orders", icon: ShoppingBag },
  ],
  driver: [
    { to: "/driver/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/driver/route", label: "Route", icon: RouteIcon },
  ],
};

const ROLE_LABEL = { farmer: "Farmer", buyer: "Buyer", driver: "Driver" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = user?.role || "farmer";
  const links = NAV_BY_ROLE[role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = (user?.name || "K D")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="kd-navbar">
      <div className="kd-navbar__inner">
        <NavLink to={links[0]?.to || "/login"} className="kd-brand">
          <Sprout className="kd-brand__mark" strokeWidth={2.2} />
          Kissan-Direct
        </NavLink>

        <button
          className="kd-btn kd-btn--ghost kd-navbar__menu-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`kd-navbar__links ${open ? "kd-navbar__links--open" : ""}`}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `kd-navlink ${isActive ? "kd-navlink--active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="kd-navbar__right">
          <span className="kd-role-chip">
            <Truck size={13} style={{ display: role === "driver" ? "block" : "none" }} />
            {ROLE_LABEL[role]}
          </span>
          <div className="kd-avatar" title={user?.name}>
            {initials}
          </div>
          <button className="kd-btn kd-btn--ghost kd-btn--sm" onClick={handleLogout}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
