import React, { useState, useEffect } from "react";
import "../Styles/catalogo.css";



export default function Catalog() {
const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE;


  const [emprendimientos, setEmprendimientos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ------------------------------------------------------------------
  // 1️⃣ — CARGAR TODOS LOS EMPRENDIMIENTOS
  // ------------------------------------------------------------------
  useEffect(() => {
    async function cargarEmprendimientos() {
      try {
        console.log("🌐 API_BASE:", API_BASE);

        const res = await fetch(`${API_BASE}/emprendimientos`);
        const data = await res.json();

        console.log("✅ Emprendimientos cargados:", data);

        if (Array.isArray(data)) {
          setEmprendimientos(data);
        } else {
          console.error("⚠️ Respuesta inesperada:", data);
          setMsg("Error al cargar emprendimientos");
        }
      } catch (err) {
        console.error("❌ Error al cargar emprendimientos:", err);
        setMsg("Error al conectar con el servidor");
      }
    }

    cargarEmprendimientos();
  }, []);

  // ------------------------------------------------------------------
  // 2️⃣ — MOSTRAR CATÁLOGO DE UN EMPRENDIMIENTO (solo productos activos)
  // ------------------------------------------------------------------
  const abrirCatalogo = async (emprendimiento) => {
    console.log("🟢 Abriendo catálogo de:", emprendimiento.nombre);

    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/products/byEmprendimiento/${emprendimiento.id}`);
      const data = await res.json();

      console.log("📦 Productos obtenidos:", data);

      // Validar si el backend devuelve un arreglo
      if (!Array.isArray(data)) {
        console.warn("⚠️ La API no devolvió una lista, revisa la ruta en el backend.");
        setMsg("No se pudieron cargar los productos de este emprendimiento.");
        return;
      }

      // Filtrar solo productos activos
      const productosActivos = data.filter((p) => p.activo === 1 || p.activo === true);

      setSeleccionado(emprendimiento);
      setProductos(productosActivos);
      setMsg("");
    } catch (err) {
      console.error("❌ Error cargando productos:", err);
      setMsg("Error al cargar productos del emprendimiento.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 3️⃣ — VISTA DETALLADA DEL EMPRENDIMIENTO
  // ------------------------------------------------------------------
  if (seleccionado) {
    return (
      <div className="catalog-container">
        <button className="back-btn" onClick={() => setSeleccionado(null)}>
          ← Volver
        </button>

        <div className="vendor-header">
          <img
            src={`${API_BASE}${seleccionado.imagen || "/uploads/default_logo.png"}`}
            alt={seleccionado.nombre}
            className="vendor-banner"
          />
          <div className="vendor-info">
            <h2>{seleccionado.nombre}</h2>
            <p className="vendor-desc">{seleccionado.descripcion}</p>
            <p><strong>Categoría:</strong> {seleccionado.categoria}</p>
            <p><strong>Ubicación:</strong> {seleccionado.ubicacion}</p>
            <p><strong>Contacto:</strong> {seleccionado.contacto}</p>
          </div>
        </div>

        <h3 className="section-title">Productos disponibles</h3>

        {loading ? (
          <p>Cargando productos...</p>
        ) : productos.length > 0 ? (
          <div className="product-list">
            {productos.map((p) => (
              <div className="product-card" key={p.id}>
                <img
                  src={`${API_BASE}${p.imagen}`}
                  alt={p.nombre}
                  className="product-image"
                />
                <div className="product-info">
                  <h4>{p.nombre}</h4>
                  <p>{p.descripcion}</p>
                  <span className="price">💲{p.precio}</span>
                  <button className="reserve-btn">🛒 Reservar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-products">No hay productos activos en este momento.</p>
        )}

        {msg && <p className="error">{msg}</p>}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 4️⃣ — VISTA PRINCIPAL: LISTA DE EMPRENDIMIENTOS
  // ------------------------------------------------------------------
  return (
    <div className="catalog-container">
      <h2 className="main-title">Emprendimientos activos</h2>

      {msg && <p className="error">{msg}</p>}

      {emprendimientos.length === 0 ? (
        <p className="no-products">No hay emprendimientos registrados aún.</p>
      ) : (
        <div className="vendor-list">
          {emprendimientos.map((e) => (
            <div
              key={e.id}
              className="vendor-card"
              onClick={() => abrirCatalogo(e)}
            >
              <img
                src={`${API_BASE}${e.imagen || "/uploads/default_logo.png"}`}
                alt={`Logo de ${e.nombre}`}
                className="vendor-logo"
              />
              <h3>{e.nombre}</h3>
              <p className="vendor-categoria">
                Categoría: <strong>{e.categoria}</strong>
              </p>
              <p className="vendor-descripcion-corta">
                {e.descripcion?.substring(0, 80) || "Sin descripción..."}
              </p>
              <p><strong>Ubicación:</strong> {e.ubicacion}</p>
              <p className="click-indicator">Ver productos →</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
