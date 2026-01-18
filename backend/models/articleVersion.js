module.exports = (sequelize, DataTypes) => {
  const ArticleVersion = sequelize.define('ArticleVersion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    articleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachments: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'article_versions',
    timestamps: true
  });

  return ArticleVersion;
};
