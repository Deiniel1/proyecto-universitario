import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import User from './user.js';

const Emprendimiento = sequelize.define('Emprendimiento', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  categoria: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  contacto: { type: DataTypes.STRING, allowNull: true },
});

// Relación: un usuario tiene un emprendimiento
User.hasOne(Emprendimiento, { foreignKey: 'userId', onDelete: 'CASCADE' });
Emprendimiento.belongsTo(User, { foreignKey: 'userId' });

export default Emprendimiento;
