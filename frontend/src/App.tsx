import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { BookingProvider } from "./context/BookingContext";
import { api } from "./api/client";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Hold from "./pages/Hold";
import Tours from "./pages/Tours";
import Checkout from "./pages/Checkout";
import Ticket from "./pages/Ticket";

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!api.isAuthed()) return <Navigate to="/login" replace />;
  return children;
}

function Navbar() {
  const navigate = useNavigate();
  const authed = api.isAuthed();
  return (
    <div className="navbar">
      <Link to="/" className="brand" style={{ textDecoration: "none" }}>FUTURE TRAVEL AND TOURS</Link>
      {authed && (
        <button
          className="btn btn-ghost"
          style={{ width: "auto", padding: "8px 16px" }}
          onClick={() => { api.clearToken(); navigate("/login"); }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
          <Route path="/hold" element={<RequireAuth><Hold /></RequireAuth>} />
          <Route path="/tours" element={<RequireAuth><Tours /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/ticket/:bookingId" element={<RequireAuth><Ticket /></RequireAuth>} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
