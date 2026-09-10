import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sprout, User, Mail, Phone, Lock, Tractor, ShoppingBasket, Truck } from "lucide-react";
import CropField from "../components/CropDecorations.jsx";
import Field from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Alert from "../components/Alert.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ROLES = [
  { key: "FARMER", label: "Farmer", icon: Tractor },
  { key: "BUYER", label: "Buyer", icon: ShoppingBasket },
  { key: "DRIVER", label: "Driver", icon: Truck },
];

const HOME_BY_ROLE = {
  FARMER: "/farmer/dashboard",
  BUYER: "/marketplace",
  DRIVER: "/driver/dashboard",
};

const INITIAL_FARMER_FIELDS = {
  village: "",
  panchayat: "",
  district: "",
  state: "",
  latitude: "",
  longitude: "",
};

const INITIAL_BUYER_FIELDS = {
  business_name: "",
  business_type: "Retailer",
  village: "",
  panchayat: "",
  district: "",
  state: "",
  latitude: "",
  longitude: "",
};

const INITIAL_DRIVER_FIELDS = {
  vehicle_type: "Mini Truck",
  vehicle_number: "",
  vehicle_capacity_kg: "",
  current_latitude: "",
  current_longitude: "",
};

export default function Register() {
  const [role, setRole] = useState("FARMER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [farmerFields, setFarmerFields] = useState(INITIAL_FARMER_FIELDS);
  const [buyerFields, setBuyerFields] = useState(INITIAL_BUYER_FIELDS);
  const [driverFields, setDriverFields] = useState(INITIAL_DRIVER_FIELDS);

  const [error, setError] = useState("");
  const [stage, setStage] = useState("form");
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleFarmerChange(key, value) {
    setFarmerFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleBuyerChange(key, value) {
    setBuyerFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleDriverChange(key, value) {
    setDriverFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all required user credentials.");
      return;
    }

    if (role === "FARMER" && (!farmerFields.village.trim() || !farmerFields.district.trim() || !farmerFields.state.trim())) {
      setError("Please provide Village, District, and State for Farmer Profile.");
      return;
    }

    if (role === "BUYER" && !buyerFields.business_name.trim()) {
      setError("Please provide Business Name for Buyer Profile.");
      return;
    }

    setError("");
    setStage("loading");

    const detail =
      role === "FARMER"
        ? `${farmerFields.village}, ${farmerFields.district}`
        : role === "BUYER"
        ? buyerFields.business_name
        : driverFields.vehicle_type;

    window.setTimeout(() => {
      login({
        role: role.toLowerCase(),
        email,
        name,
        detail,
        profileData: role === "FARMER" ? farmerFields : role === "BUYER" ? buyerFields : driverFields,
      });
      navigate(HOME_BY_ROLE[role], { replace: true });
    }, 1700);
  }

  if (stage === "loading") {
    return <LoadingScreen label="Saving profile to database…" />;
  }

  return (
    <div className="kd-auth">
      <div className="kd-auth__field-texture" />
      <CropField variant={role.toLowerCase()} />

      <div className="kd-auth__card kd-auth__card--wide">
        <div className="kd-auth__brand">
          <Sprout className="kd-auth__brand-mark" strokeWidth={2} />
          <span className="kd-display-2">Join Kissan-Direct</span>
        </div>
        <p className="kd-auth__subtitle">Create your database-verified account</p>

        <div className="kd-role-grid" role="radiogroup" aria-label="I am a">
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
          <span className="kd-eyebrow">Account Credentials (users table)</span>
          <div className="kd-grid kd-grid--2 kd-mt-sm">
            <Field label="Name *" icon={User} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Field label="Phone" icon={Phone} placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="kd-grid kd-grid--2">
            <Field label="Email *" icon={Mail} type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field label="Password *" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {role === "FARMER" && (
            <>
              <span className="kd-eyebrow kd-mt-md" style={{ display: "block" }}>Farmer Profile (farmer_profiles table)</span>
              <div className="kd-grid kd-grid--2 kd-mt-sm">
                <Field label="Village *" placeholder="Village Name" value={farmerFields.village} onChange={(e) => handleFarmerChange("village", e.target.value)} required />
                <Field label="Panchayat" placeholder="Gram Panchayat" value={farmerFields.panchayat} onChange={(e) => handleFarmerChange("panchayat", e.target.value)} />
              </div>
              <div className="kd-grid kd-grid--2">
                <Field label="District *" placeholder="District" value={farmerFields.district} onChange={(e) => handleFarmerChange("district", e.target.value)} required />
                <Field label="State *" placeholder="State" value={farmerFields.state} onChange={(e) => handleFarmerChange("state", e.target.value)} required />
              </div>
              <div className="kd-grid kd-grid--2">
                <Field label="Latitude" type="number" step="0.000001" placeholder="e.g. 29.6857" value={farmerFields.latitude} onChange={(e) => handleFarmerChange("latitude", e.target.value)} />
                <Field label="Longitude" type="number" step="0.000001" placeholder="e.g. 76.9905" value={farmerFields.longitude} onChange={(e) => handleFarmerChange("longitude", e.target.value)} />
              </div>
            </>
          )}

          {role === "BUYER" && (
            <>
              <span className="kd-eyebrow kd-mt-md" style={{ display: "block" }}>Buyer Profile (buyer_profiles table)</span>
              <div className="kd-grid kd-grid--2 kd-mt-sm">
                <Field label="Business Name *" placeholder="Enterprise / Store Name" value={buyerFields.business_name} onChange={(e) => handleBuyerChange("business_name", e.target.value)} required />
                <Field
                  label="Business Type"
                  as="select"
                  value={buyerFields.business_type}
                  onChange={(e) => handleBuyerChange("business_type", e.target.value)}
                  options={["Retailer", "Wholesaler", "Restaurant", "Trader", "Individual"]}
                />
              </div>
              <div className="kd-grid kd-grid--2">
                <Field label="Village" placeholder="Village / Area" value={buyerFields.village} onChange={(e) => handleBuyerChange("village", e.target.value)} />
                <Field label="Panchayat" placeholder="Panchayat / Ward" value={buyerFields.panchayat} onChange={(e) => handleBuyerChange("panchayat", e.target.value)} />
              </div>
              <div className="kd-grid kd-grid--2">
                <Field label="District" placeholder="District" value={buyerFields.district} onChange={(e) => handleBuyerChange("district", e.target.value)} />
                <Field label="State" placeholder="State" value={buyerFields.state} onChange={(e) => handleBuyerChange("state", e.target.value)} />
              </div>
              <div className="kd-grid kd-grid--2">
                <Field label="Latitude" type="number" step="0.000001" placeholder="e.g. 28.6517" value={buyerFields.latitude} onChange={(e) => handleBuyerChange("latitude", e.target.value)} />
                <Field label="Longitude" type="number" step="0.000001" placeholder="e.g. 77.1906" value={buyerFields.longitude} onChange={(e) => handleBuyerChange("longitude", e.target.value)} />
              </div>
            </>
          )}

          {role === "DRIVER" && (
            <>
              <span className="kd-eyebrow kd-mt-md" style={{ display: "block" }}>Driver Profile (driver_profiles table)</span>
              <div className="kd-grid kd-grid--2 kd-mt-sm">
                <Field label="Vehicle Type" placeholder="Mini Truck, Pickup, etc." value={driverFields.vehicle_type} onChange={(e) => handleDriverChange("vehicle_type", e.target.value)} />
                <Field label="Vehicle Number" placeholder="HR-06-AB-1234" value={driverFields.vehicle_number} onChange={(e) => handleDriverChange("vehicle_number", e.target.value)} />
              </div>
              <Field label="Vehicle Capacity (kg)" type="number" step="0.01" placeholder="1500.00" value={driverFields.vehicle_capacity_kg} onChange={(e) => handleDriverChange("vehicle_capacity_kg", e.target.value)} />
              <div className="kd-grid kd-grid--2">
                <Field label="Current Latitude" type="number" step="0.000001" placeholder="e.g. 29.6857" value={driverFields.current_latitude} onChange={(e) => handleDriverChange("current_latitude", e.target.value)} />
                <Field label="Current Longitude" type="number" step="0.000001" placeholder="e.g. 76.9905" value={driverFields.current_longitude} onChange={(e) => handleDriverChange("current_longitude", e.target.value)} />
              </div>
            </>
          )}

          <Button type="submit" full className="kd-mt-lg">
            Register Account
          </Button>
        </form>

        <p className="kd-auth__footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}