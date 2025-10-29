import React, { useState } from "react";
import '../Styles/forms.css'; // ✅ Reutilizamos el mismo CSS base

export default function AddProduct() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    imagen: null,
  });
  const [msg, setMsg] = useState("");

  if (!token) {
    return <p className="warning">⚠️ Debes iniciar sesión como vendedor para agregar productos.</p>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("Subiendo producto...");

    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("descripcion", form.descripcion);
    data.append("precio", form.precio);
    if (form.imagen) data.append("imagen", form.imagen);

    try {
      const res = await fetch("http://localhost:4000/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();
      if (res.ok) {
        setMsg("✅ Producto agregado correctamente");
        setForm({ nombre: "", descripcion: "", precio: "", imagen: null });
      } else {
        setMsg("❌ " + (result.error || "Error al subir producto"));
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Error de conexión con el servidor");
    }
  }

  return (
    <div className="form-container form-producto">
      <h2>Agregar Producto</h2>
      <form onSubmit={handleSubmit}>
        <label>Nombre del producto</label>
        <input
          type="text"
          placeholder="Ej: Brownie artesanal"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />

        <label>Descripción</label>
        <textarea
          placeholder="Describe brevemente el producto..."
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          required
        ></textarea>

        <label>Precio</label>
        <input
          type="number"
          step="0.01"
          placeholder="Ej: 5500"
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
          required
        />

        <label>Imagen</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm({ ...form, imagen: e.target.files[0] })}
        />

        <button type="submit" className="btn-primary">
          Guardar producto
        </button>
      </form>
      {msg && (
        <p className={msg.startsWith("✅") ? "success" : "error"}>{msg}</p>
      )}
    </div>
  );
}
