import React, { useState } from 'react';
import '../Styles/forms.css'; // ✅ Importa los estilos

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setMsg('Verificando...');

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setMsg('✅ Inicio de sesión exitoso');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMsg('❌ ' + (data.error || 'Error al iniciar sesión'));
      }
    } catch (err) {
      console.error(err);
      setMsg('❌ Error al conectar con el servidor');
    }

    // 👇 Redirección según rol
  setTimeout(() => {
    if (data.user.role === "vendedor") {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/";
    }
  }, 1200);

  }

  // 👇 return bien cerrado
  return (
    <div className="form-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit">Ingresar</button>
      </form>
      {msg && <p className={msg.startsWith('✅') ? 'success' : 'error'}>{msg}</p>}
    </div>
  );
}
