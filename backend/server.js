// server.js (versión corregida y coherente)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || './data/db.sqlite';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(DB_PATH);

// ---------- Crear tablas (asegurar columnas 'activo') ----------
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS emprendimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    nombre TEXT,
    descripcion TEXT,
    categoria TEXT,
    ubicacion TEXT,
    contacto TEXT,
    imagen TEXT,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emprendimiento_id INTEGER,
    nombre TEXT,
    descripcion TEXT,
    precio REAL,
    stock INTEGER,
    imagen TEXT,
    tags TEXT,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY(emprendimiento_id) REFERENCES emprendimientos(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    emprendimiento_id INTEGER,
    total REAL,
    estado TEXT DEFAULT 'pendiente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    cantidad INTEGER,
    precio REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    contenido TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    descripcion TEXT,
    fecha_evento TEXT,
    ubicacion TEXT,
    organizer_id INTEGER
  )`);
});

// ---------- Express + middlewares ----------
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, './uploads/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + '_' + file.originalname); }
});
const upload = multer({ storage });

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload;
    next();
  });
}

// ---------- Auth: register / login ----------
app.post('/auth/register', async (req, res) => {
  const { name, email, password, role = 'cliente' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'faltan datos' });
  const hashed = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)`,
    [name, email, hashed, role], function (err) {
      if (err) return res.status(400).json({ error: err.message });
      const user = { id: this.lastID, name, email, role };
      const token = generateToken(user);
      res.json({ user, token });
    });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'credenciales incorrectas' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'credenciales incorrectas' });
    const token = generateToken(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  });
});

// ---------- Productos del vendedor logueado ----------
app.get('/products', authenticate, (req, res) => {
  db.all(
    `SELECT p.* FROM products p
     JOIN emprendimientos e ON e.id = p.emprendimiento_id
     WHERE e.user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ---------- Crear producto (vendedor) ----------
app.post('/products', authenticate, upload.single('imagen'), (req, res) => {
  const { nombre, descripcion, precio, stock, tags } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : '';

  if (!nombre || !descripcion || !precio) {
    return res.status(400).json({ error: 'Faltan datos del producto' });
  }

  db.get(`SELECT * FROM emprendimientos WHERE user_id = ?`, [req.user.id], (err, emp) => {
    if (err) return res.status(500).json({ error: 'Error al buscar emprendimiento' });
    if (!emp) return res.status(400).json({ error: 'Debes registrar primero tu emprendimiento' });

    db.run(
      `INSERT INTO products (emprendimiento_id, nombre, descripcion, precio, stock, imagen, tags, activo)
       VALUES (?,?,?,?,?,?,?,1)`,
      [emp.id, nombre, descripcion, precio, stock || 0, imagen, tags || ''],
      function (err2) {
        if (err2) return res.status(500).json({ error: 'Error al crear producto' });
        db.get(`SELECT * FROM products WHERE id = ?`, [this.lastID], (e, producto) => {
          if (e) return res.status(500).json({ error: 'Error al obtener producto' });
          res.json(producto);
        });
      }
    );
  });
});

// ---------- Pedidos (simple) ----------
app.post('/orders', authenticate, (req, res) => {
  const { items, emprendimiento_id } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'sin items' });
  const total = items.reduce((s, i) => s + (i.precio * i.cantidad), 0);
  db.run(`INSERT INTO orders (cliente_id, emprendimiento_id, total) VALUES (?,?,?)`,
    [req.user.id, emprendimiento_id, total], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const orderId = this.lastID;
      const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, cantidad, precio) VALUES (?,?,?,?)`);
      items.forEach(it => stmt.run(orderId, it.product_id, it.cantidad, it.precio));
      stmt.finalize(() => {
        db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (e, row) => res.json({ order: row }));
      });
    });
});

// ---------- Emprendimientos: crear / actualizar / consultar ----------
app.post('/emprendimientos', authenticate, upload.single('imagen'), (req, res) => {
  const { nombre, descripcion, categoria, ubicacion, contacto } = req.body;
  const imagen = req.file ? `/uploads/${req.file.filename}` : '';
  if (!nombre || !categoria || !descripcion || !contacto) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    `INSERT INTO emprendimientos (user_id, nombre, descripcion, categoria, ubicacion, contacto, imagen, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [req.user.id, nombre, descripcion, categoria, ubicacion, contacto, imagen],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM emprendimientos WHERE id = ?`, [this.lastID], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json(row);
      });
    }
  );
});

app.put('/emprendimientos/:id', authenticate, upload.single('imagen'), (req, res) => {
  const { nombre, descripcion, categoria, ubicacion, contacto } = req.body;
  const id = req.params.id;
  const imagen = req.file ? `/uploads/${req.file.filename}` : null;

  db.get(`SELECT * FROM emprendimientos WHERE id = ? AND user_id = ?`, [id, req.user.id], (err, emp) => {
    if (err) return res.status(500).json({ error: 'Error al buscar emprendimiento' });
    if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

    const sql = `
      UPDATE emprendimientos
      SET nombre = ?, descripcion = ?, categoria = ?, ubicacion = ?, contacto = ?, imagen = COALESCE(?, imagen)
      WHERE id = ? AND user_id = ?
    `;
    const params = [nombre, descripcion, categoria, ubicacion, contacto, imagen, id, req.user.id];

    db.run(sql, params, function (err2) {
      if (err2) return res.status(500).json({ error: 'Error al actualizar emprendimiento' });

      db.get(`SELECT * FROM emprendimientos WHERE id = ?`, [id], (e, updated) => {
        if (e) return res.status(500).json({ error: 'Error al obtener datos actualizados' });
        res.json(updated);
      });
    });
  });
});

// Obtener mi emprendimiento (propio) - autenticado
app.get('/emprendimientos/mio', authenticate, (req, res) => {
  db.get(`SELECT * FROM emprendimientos WHERE user_id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

// Obtener todos los emprendimientos (para listado general)
app.get('/emprendimientos', (req, res) => {
  db.all(`SELECT * FROM emprendimientos`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Obtener emprendimientos activos (publico)
app.get('/emprendimientos/activos', (req, res) => {
  db.all(`SELECT * FROM emprendimientos WHERE activo = 1`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Obtener un emprendimiento con TODOS sus productos (útil para admin/vendedor)
app.get('/emprendimientos/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM emprendimientos WHERE id = ?`, [id], (err, emp) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!emp) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

    db.all(`SELECT * FROM products WHERE emprendimiento_id = ?`, [id], (err2, productos) => {
      if (err2) return res.status(500).json({ error: err2.message });
      // devolver el emprendimiento y su lista de productos
      res.json({ ...emp, productos });
    });
  });
});

// ---------- RUTA QUE NECESITA EL FRONT: productos activos del emprendimiento ----------
app.get('/emprendimientos/:id/productos', (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT * FROM products WHERE emprendimiento_id = ? AND activo = 1`,
    [id],
    (err, productos) => {
      if (err) {
        console.error('Error al obtener productos activos:', err);
        return res.status(500).json({ error: 'Error al obtener productos' });
      }
      res.json(productos);
    }
  );
});

// Obtener productos por emprendimiento (ruta alternativa que devuelve todo)
app.get('/products/byEmprendimiento/:id', (req, res) => {
  db.all(`SELECT * FROM products WHERE emprendimiento_id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Eliminar producto (vendedor)
app.delete('/products/:id', authenticate, (req, res) => {
  db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Activar/desactivar producto (vendedor)
app.put('/products/:id/toggle', authenticate, (req, res) => {
  const productId = req.params.id;

  db.get(
    `SELECT p.*, e.user_id FROM products p 
     JOIN emprendimientos e ON e.id = p.emprendimiento_id
     WHERE p.id = ?`,
    [productId],
    (err, producto) => {
      if (err) return res.status(500).json({ error: 'Error interno' });
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      if (producto.user_id !== req.user.id)
        return res.status(403).json({ error: 'No tienes permiso para modificar este producto' });

      const nuevoEstado = producto.activo ? 0 : 1;

      db.run(`UPDATE products SET activo = ? WHERE id = ?`, [nuevoEstado, productId], (err2) => {
        if (err2) return res.status(500).json({ error: 'Error al cambiar estado' });
        res.json({
          message: nuevoEstado ? '✅ Producto activado' : '🚫 Producto desactivado',
          activo: nuevoEstado,
        });
      });
    }
  );
});

// Activar/desactivar emprendimiento (vendedor)
app.put('/emprendimientos/:id/toggle', authenticate, (req, res) => {
  const { id } = req.params;
  db.get(`SELECT activo, user_id FROM emprendimientos WHERE id = ? AND user_id = ?`, [id, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Emprendimiento no encontrado' });

    const nuevo = row.activo ? 0 : 1;
    db.run(`UPDATE emprendimientos SET activo = ? WHERE id = ? AND user_id = ?`, [nuevo, id, req.user.id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: nuevo ? '✅ Emprendimiento activado' : '🚫 Emprendimiento desactivado', activo: nuevo });
    });
  });
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () =>
  console.log(`API corriendo en http://0.0.0.0:${PORT}`)
);
