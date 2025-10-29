import React, { useState, useEffect } from "react";

export default function EditEmprendimiento() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    id: null,
    nombre: "",
    descripcion: "",
    categoria: "",
    ubicacion: "",
    contacto: "",
    imagen: null,
  });
  const [original, setOriginal] = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:4000/emprendimientos/mio", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data) {
          setForm({
            id: data.id,
            nombre: data.nombre || "",
            descripcion: data.descripcion || "",
            categoria: data.categoria || "",
            ubicacion: data.ubicacion || "",
            contacto: data.contacto || "",
            imagen: null,
          });
          setOriginal(data);
          if (data.imagen) setPreview(`http://localhost:4000${data.imagen}`);
        } else {
          setMsg("❌ No se encontró el emprendimiento");
        }
      } catch (err) {
        console.error("Error en fetch:", err);
        setMsg("❌ Error al conectar con el servidor");
      }
    }
    fetchData();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();

    const hayCambios = Object.keys(form).some((key) => {
      if (key === "imagen") return !!form.imagen;
      return form[key] !== original?.[key];
    });

    if (!hayCambios) {
      setMsg("⚠️ No se detectaron cambios. Realiza una modificación antes de actualizar.");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    try {
      const res = await fetch(`http://localhost:4000/emprendimientos/${form.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await res.json();

      if (res.ok) {
        setMsg("✅ Emprendimiento actualizado correctamente");
        setOriginal(form);
      } else {
        setMsg("❌ " + (result.error || "Error al actualizar"));
      }
    } catch (err) {
      console.error("Error al enviar:", err);
      setMsg("❌ Error al conectar con el servidor");
    }
  }

  return (
    <div className="form-container">
      <h2>Editar Emprendimiento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre"
          required
        />
        <textarea
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Descripción"
          required
        />
        <input
          type="text"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          placeholder="Categoría"
          required
        />
        <input
          type="text"
          value={form.ubicacion}
          onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
          placeholder="Ubicación"
          required
        />
        <input
          type="text"
          value={form.contacto}
          onChange={(e) => setForm({ ...form, contacto: e.target.value })}
          placeholder="Contacto"
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setForm({ ...form, imagen: file });
              setPreview(URL.createObjectURL(file));
            }
          }}
        />

        {preview && (
          <div style={{ marginTop: "10px" }}>
            <p>📸 Vista previa:</p>
            <img src={preview} alt="logo" width="120" />
          </div>
        )}

        <button type="submit">Guardar cambios</button>
      </form>

      {msg && (
        <p
          className={
            msg.startsWith("✅")
              ? "success"
              : msg.startsWith("⚠️")
              ? "warning"
              : "error"
          }
        >
          {msg}
        </p>
      )}
    </div>
  );
}
