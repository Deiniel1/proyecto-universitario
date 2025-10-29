import React, { useState, useEffect } from 'react';
import '../Styles/forms.css';

export default function Emprendimiento() {
  const token = localStorage.getItem('token');
  const [emprendimiento, setEmprendimiento] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    contacto: '',
  });

 // Emprendimiento.jsx (Modificar el useEffect)
  useEffect(() => {
    if (!token) return;

    fetch('http://localhost:4000/emprendimientos/mio', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // ✅ CORRECCIÓN: Solo establece el estado si NO hay error y DATA NO es nula/vacía.
        // Si el servidor devuelve null (como corregimos arriba), 'data' será null, y no se llamará a setEmprendimiento.
        if (!data.error && data) {
             setEmprendimiento(data);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg('Guardando...');
    try {
      const res = await fetch('http://localhost:4000/emprendimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setEmprendimiento(data);
        setMsg('✅ Emprendimiento registrado correctamente');
      } else {
        setMsg('❌ ' + (data.error || 'Error al registrar'));
      }
    } catch {
      setMsg('❌ Error al conectar con el servidor');
    }
  }

  if (!token) {
    return <p>⚠️ Debes iniciar sesión como vendedor para registrar tu emprendimiento.</p>;
  }

  return (
     <div style={{ maxWidth: 500, margin: '0 auto' }}>
       {emprendimiento ? (
        <>
          <h2>Mi Emprendimiento</h2>
          <p><b>Nombre:</b> {emprendimiento.nombre}</p>
          <p><b>Categoría:</b> {emprendimiento.categoria}</p>
          <p><b>Descripción:</b> {emprendimiento.descripcion}</p>
          <p><b>Contacto:</b> {emprendimiento.contacto}</p>
        </>
      ) : (
        // 👇🏼 CAMBIO CLAVE: Usa el div con la clase .form-container en lugar de un fragmento
        <div className="form-container">
          <h2>Registrar emprendimiento</h2>
          {/* Se recomienda mover el estilo inline a la clase .emprendimiento-form en tu CSS */}
          <form onSubmit={handleSubmit} className="emprendimiento-form" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              placeholder="Nombre del emprendimiento"
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Categoría"
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              required
            />
            <textarea
              placeholder="Descripción"
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
            ></textarea>
            <input
              type="text"
              placeholder="Contacto (WhatsApp, Instagram, etc.)"
              onChange={(e) => setForm({ ...form, contacto: e.target.value })}
              required
            />
            <button type="submit">Guardar</button>
          </form>
        </div>
      )}
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}