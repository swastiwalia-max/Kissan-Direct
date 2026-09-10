import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import FarmerDashboard from "./pages/FarmerDashboard.jsx";
import AddProduce from "./pages/AddProduce.jsx";
import MyListings from "./pages/MyListings.jsx";
import FarmerOrders from "./pages/FarmerOrders.jsx";

import Marketplace from "./pages/Marketplace.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import BuyerOrders from "./pages/BuyerOrders.jsx";

import DriverDashboard from "./pages/DriverDashboard.jsx";
import DeliveryDetails from "./pages/DeliveryDetails.jsx";
import RoutePage from "./pages/Route.jsx";

const HOME_BY_ROLE = {
  farmer: "/farmer/dashboard",
  buyer: "/marketplace",
  driver: "/driver/dashboard",
};

/** Redirects to /login if there's no mock session, or to the correct
 * dashboard if the session role doesn't match the page's expected role. */
function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return children;
}

export default function App() {
  return (
    <div className="kd-app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/farmer/dashboard"
          element={
            <Protected role="farmer">
              <FarmerDashboard />
            </Protected>
          }
        />
        <Route
          path="/farmer/add-produce"
          element={
            <Protected role="farmer">
              <AddProduce />
            </Protected>
          }
        />
        <Route
          path="/farmer/listings"
          element={
            <Protected role="farmer">
              <MyListings />
            </Protected>
          }
        />
        <Route
          path="/farmer/orders"
          element={
            <Protected role="farmer">
              <FarmerOrders />
            </Protected>
          }
        />

        <Route
          path="/marketplace"
          element={
            <Protected role="buyer">
              <Marketplace />
            </Protected>
          }
        />
        <Route
          path="/marketplace/:productId"
          element={
            <Protected role="buyer">
              <ProductDetails />
            </Protected>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <Protected role="buyer">
              <BuyerOrders />
            </Protected>
          }
        />

        <Route
          path="/driver/dashboard"
          element={
            <Protected role="driver">
              <DriverDashboard />
            </Protected>
          }
        />
        <Route
          path="/driver/delivery/:deliveryId"
          element={
            <Protected role="driver">
              <DeliveryDetails />
            </Protected>
          }
        />
        <Route
          path="/driver/route"
          element={
            <Protected role="driver">
              <RoutePage />
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
