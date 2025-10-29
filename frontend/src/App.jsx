import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import Register from "./pages/Register";
import AddProduct from "./pages/AddProduct";
import Dashboard from "./pages/Dashboard";
import Emprendimiento from "./pages/Emprendimiento";
import EditEmprendimiento from "./pages/EditEmprendimiento";
import "./Styles/app.css";

export default function App() {
  const [page, setPage] = useState("catalog");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const handleChange = (e) => setPage(e.detail);
    window.addEventListener("changePage", handleChange);
    return () => window.removeEventListener("changePage", handleChange);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <header>
        <h1>EmprendeSoacha</h1>
        <nav style={{ display: "flex", gap: "10px" }}>
          {!user && (
            <>
              <button onClick={() => setPage("login")}>Login</button>
              <button onClick={() => setPage("register")}>Registro</button>
            </>
          )}

          {user && user.role === "cliente" && (
            <>
              <button onClick={() => setPage("catalog")}>Catálogo</button>
              <button
                className="logout"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
              >
                🔒 Cerrar sesión
              </button>
            </>
          )}

          {user && user.role === "vendedor" && (
            <>
              <button onClick={() => setPage("dashboard")}>Dashboard</button>
              <button onClick={() => setPage("emprendimiento")}>Mi Emprendimiento</button>
              <button onClick={() => setPage("editEmprendimiento")}>Editar Emprendimiento</button>
              <button onClick={() => setPage("addproduct")}>Agregar Producto</button>
              <button
                className="logout"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/";
                }}
              >
                🔒 Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </header>

      <main style={{ marginTop: 20 }}>
        {page === "catalog" && <Catalog />}
        {page === "login" && <Login />}
        {page === "register" && <Register />}
        {page === "dashboard" && <Dashboard />}
        {page === "emprendimiento" && <Emprendimiento />}
        {page === "editEmprendimiento" && <EditEmprendimiento />}
        {page === "addproduct" && <AddProduct />}
      </main>
    </div>
  );
}
