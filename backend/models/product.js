import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import Emprendimiento from './Emprendimiento.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precio: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  imagen: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// Relación: un emprendimiento tiene muchos productos
Emprendimiento.hasMany(Product, { foreignKey: 'emprendimientoId', onDelete: 'CASCADE' });
Product.belongsTo(Emprendimiento, { foreignKey: 'emprendimientoId' });

export default Product;
