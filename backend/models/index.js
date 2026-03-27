const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config').development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Article = require('./article')(sequelize, DataTypes);
db.Comment = require('./comment')(sequelize, DataTypes);
db.Workspace = require('./workspace')(sequelize, DataTypes);

db.Workspace.hasMany(db.Article, { foreignKey: 'workspaceId' });
db.Article.belongsTo(db.Workspace, { foreignKey: 'workspaceId' });

db.Article.hasMany(db.Comment, { foreignKey: 'articleId', onDelete: 'CASCADE' });
db.Comment.belongsTo(db.Article, { foreignKey: 'articleId' });

module.exports = db;
