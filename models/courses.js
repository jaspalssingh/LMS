'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Courses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Courses.hasMany(models.Chapter, {
        foreignKey: "courseid",
      })
    }
    static getcoursename() {
      return this.findAll();
    }
    static remove(id) {
      return this.destroy({
        where: {
          id: id
        }
      })
    }
  }

  Courses.init({
    coursename: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Courses',
  });
  return Courses;
};