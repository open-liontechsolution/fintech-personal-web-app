import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Interface for Category attributes
interface CategoryAttributes {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parentId: string | null; // Para subcategorías
  isSystem: boolean; // Indica si es una categoría del sistema (no eliminable)
  metadata: any | null; // Campo JSONB para metadatos flexibles
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Category creation attributes
interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description' | 'color' | 'icon' | 'parentId' | 'metadata' | 'isSystem'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public color!: string | null;
  public icon!: string | null;
  public parentId!: string | null;
  public isSystem!: boolean;
  public metadata!: any | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Obtener categorías secundarias
  public async getSubcategories() {
    return Category.findAll({
      where: { parentId: this.id }
    });
  }

  // Verificar si tiene subcategorías
  public async hasSubcategories() {
    const count = await Category.count({
      where: { parentId: this.id }
    });
    return count > 0;
  }
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la categoría no puede estar vacío' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(7), // Formato hexadecimal #RRGGBB
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_system',
    },
    metadata: {
      type: DataTypes.JSONB, // JSONB más eficiente que JSON en PostgreSQL
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
    underscored: true,
    indexes: [
      // Índice para búsquedas rápidas por nombre
      {
        name: 'categories_name_idx',
        fields: ['name'],
      },
      // Índice para búsquedas jerárquicas
      {
        name: 'categories_parent_id_idx',
        fields: ['parent_id'],
      },
      // Índice GIN para búsquedas en JSONB
      {
        name: 'categories_metadata_idx',
        using: 'GIN',
        fields: ['metadata'],
      }
    ]
  }
);

// Auto-referencia para jerarquía de categorías
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

export default Category;
