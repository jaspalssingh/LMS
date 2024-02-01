'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Pages.belongsTo(models.Chapter, {
        foreignKey: "chapterid",
      })
    }
    static getpages(courseid, chapterid) {
      return this.findAll({
        where: {
          courseid: courseid,
          chapterid: chapterid
        }
      });
    }
  }
  Pages.init({
    pagename: DataTypes.STRING,
    pagedescription: DataTypes.STRING,
    courseid: DataTypes.INTEGER,
    chapterid: {
      type: DataTypes.INTEGER,
      references: {
        model: "Chapter",
        key: "id",
      },
    }
  }, {
    sequelize,
    modelName: 'Pages',
  });
  return Pages;
};