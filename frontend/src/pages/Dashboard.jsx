import React, { useEffect, useState } from "react";
import "../Styles/dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [emprendimiento, setEmprendimiento] = useState(null);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);

    if (token) {
      // Traer emprendimiento del usuario
      fetch("http://localhost:4000/emprendimientos/mio", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setEmprendimiento(data))
        .catch((err) => console.error("Error cargando emprendimiento:", err));

      // Traer productos del usuario
      fetch("http://localhost:4000/products", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch((err) => console.error("Error cargando productos:", err));
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;

    try {
      const res = await fetch(`http://localhost:4000/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
        setMsg("✅ Producto eliminado correctamente");
      } else {
        const data = await res.json();
        setMsg("❌ " + (data.error || "Error al eliminar"));
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Error de conexión con el servidor");
    }
  };

  if (!user)
    return (
      <p className="warning">⚠️ Debes iniciar sesión para acceder al Dashboard</p>
    );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">👋 Bienvenido, {user.name}</h2>

      {emprendimiento ? (
        <div className="emprendimiento-info">
          <h3>{emprendimiento.nombre}</h3>
          <p>{emprendimiento.descripcion}</p>
          <p>
            <strong>Categoría:</strong> {emprendimiento.categoria}
          </p>
          <p>
            <strong>Ubicación:</strong> {emprendimiento.ubicacion}
          </p>
        </div>
      ) : (
        <p className="no-products">No tienes un emprendimiento registrado.</p>
      )}

      <div className="product-header">
        <h3>Mis Productos</h3>
        <button
          className="add-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('changePage', { detail: 'addproduct' }))}

        >
          ➕ Agregar Producto
        </button>


      </div>

      {msg && <p className="status-msg">{msg}</p>}

      <div className="product-list">
        {products.length > 0 ? (
          products.map((p) => (
            <div key={p.id} className="product-card">
              <img
                src={`http://localhost:4000${p.imagen}`}
                alt={p.nombre}
                className="product-image"
              />
              <div className="product-info">
                <h4>{p.nombre}</h4>
                <p>{p.descripcion}</p>
                <span className="price">💲{p.precio}</span>
                <div className="product-actions">
  <button
    className="edit-btn"
    onClick={() => alert("✏️ Función de edición próximamente")}
  >
    Editar
  </button>

  <button
    className="delete-btn"
    onClick={() => handleDelete(p.id)}
  >
    Eliminar
  </button>

  <button
    onClick={async () => {
      const res = await fetch(`http://localhost:4000/products/${p.id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
      window.location.reload();
    }}
    className={p.activo ? "deactivate-btn" : "activate-btn"}
  >
    {p.activo ? "Desactivar" : "Activar"}
  </button>
</div>

              </div>
            </div>
          ))
        ) : (
          <p className="no-products">Aún no tienes productos registrados.</p>
        )}
      </div>
    </div>
  );
}
