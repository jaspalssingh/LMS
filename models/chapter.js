'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Chapter.belongsTo(models.Courses, {
        foreignKey: "courseid",
      })
      Chapter.hasMany(models.Pages, {
        foreignKey: "chapterid"
      })
      // define association here
    }
    static getchapter(courseid) {
      return this.findAll({
        where: {
          courseid: courseid
        }
      });
    }
    static remove_chapter(chapterid) {
      return this.destroy({
        where: {
          id: chapterid
        }
      })
    }
    static remove(id) {
      return this.destroy({
        where: {
          courseid: id
        }
      })
    }
  }
  Chapter.init({
    chaptername: DataTypes.STRING,
    chapterdescription: DataTypes.STRING,
    courseid: {
      type: DataTypes.INTEGER,
      references: {
        model: "Courses",
        key: "id",
      },
    }
  }, {
    sequelize,
    modelName: 'Chapter',
  });
  return Chapter;
};