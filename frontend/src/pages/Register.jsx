import React, { useState } from "react";
import '../Styles/forms.css';

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("comprador"); // Valor por defecto
  const [msg, setMsg] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("Creando usuario...");

    try {
      const res = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg("✅ Registro exitoso, ahora puedes iniciar sesión");
        setName("");
        setEmail("");
        setPassword("");
        setRole("comprador");
      } else {
        setMsg("❌ " + (data.error || "Error en el registro"));
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Error al conectar con el servidor");
    }
  }

  return (
    <div className="form-container">
      <h2>Registro de Usuario</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="comprador">Comprador</option>
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit">Registrar</button>
      </form>
      {msg && <p className={msg.startsWith("✅") ? "success" : "error"}>{msg}</p>}
    </div>
  );
}