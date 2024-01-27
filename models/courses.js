'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class courses extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static coursename() {
      return this.findAll();
    }
  }
  courses.init({
    coursename: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'courses',
  });
  return courses;
};