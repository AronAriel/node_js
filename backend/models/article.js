module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'articles',
    timestamps: true
  });

  return Article;
};
