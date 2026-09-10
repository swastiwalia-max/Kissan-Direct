import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sprout, Mail, Lock, Tractor, ShoppingBasket, Truck } from "lucide-react";
import CropField from "../components/CropDecorations.jsx";
import Field from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CURRENT_FARMER, CURRENT_BUYER, CURRENT_DRIVER } from "../data/mockData.js";

const ROLES = [
  { key: "farmer", label: "Farmer", icon: Tractor },
  { key: "buyer", label: "Buyer", icon: ShoppingBasket },
  { key: "driver", label: "Driver", icon: Truck },
];

const HOME_BY_ROLE = {
  farmer: "/farmer/dashboard",
  buyer: "/marketplace",
  driver: "/driver/dashboard",
};

const MOCK_PROFILES = {
  farmer: { name: CURRENT_FARMER.name, detail: CURRENT_FARMER.farmName },
  buyer: { name: CURRENT_BUYER.name, detail: CURRENT_BUYER.business },
  driver: { name: CURRENT_DRIVER.name, detail: CURRENT_DRIVER.vehicleType },
};

export default function Login() {
  const [role, setRole] = useState("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState("form"); // form | loading
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("");
    setStage("loading");

    const profile = MOCK_PROFILES[role];
    window.setTimeout(() => {
      login({ role, email, name: profile.name, detail: profile.detail });
      navigate(HOME_BY_ROLE[role], { replace: true });
    }, 1700);
  }

  if (stage === "loading") {
    return <LoadingScreen label={`Setting up your ${role} dashboard…`} />;
  }

  return (
    <div className="kd-auth">
      <div className="kd-auth__field-texture" />
      <CropField variant={role} />

      <div className="kd-auth__card">
        <div className="kd-auth__brand">
          <Sprout className="kd-auth__brand-mark" strokeWidth={2} />
          <span className="kd-display-2">Kissan-Direct</span>
        </div>
        <p className="kd-auth__subtitle">Log in to buy, sell or deliver fresh produce — direct.</p>

        <div className="kd-role-grid" role="radiogroup" aria-label="Log in as">
          {ROLES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={role === key}
              className={`kd-role-option ${role === key ? "kd-role-option--selected" : ""}`}
              onClick={() => setRole(key)}
            >
              <Icon className="kd-role-option__icon" />
              <span className="kd-role-option__label">{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="kd-mt-sm">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="kd-mt-md">
          <Field
            label="Email"
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <Field
            label="Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Button type="submit" full className="kd-mt-sm">
            Log in as {ROLES.find((r) => r.key === role)?.label}
          </Button>
        </form>

        <p className="kd-auth__footer">
          New to Kissan-Direct? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
