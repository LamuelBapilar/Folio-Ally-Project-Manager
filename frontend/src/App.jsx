import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { getUser, logout } from "./API/login";
import Landing from "./pages/landingpage";
import Login from "./pages/loginpage";
import Register from "./pages/registerpage";
import Home from "./pages/homepage";

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => !!localStorage.getItem("token"));

  // on page load: if a token is saved, ask Laravel who it belongs to
  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    getUser()
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setChecking(false));
  }, []);

  // the saved token stopped working (it expired, or was revoked)
  useEffect(() => {
    function onExpired() {
      setUser(null);
      navigate("/login", { replace: true, state: { expired: true } });
    }

    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, [navigate]);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (checking) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Home user={user} onLogout={handleLogout} /> : <Landing />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <Register onRegister={setUser} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}