'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Enrolled extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Enrolled.belongsTo(models.Courses, {
        foreignKey: "courseid",
      })
      // define association here
    }
  }
  Enrolled.init({
    courseid: {
      type: DataTypes.INTEGER,
      references: {
        model: "Courses",
        key: "id",
      },
    },
    userid: {
      type: DataTypes.INTEGER,
      references: {
        model: "User",
        key: "id",
      }
    }
  }, {
    sequelize,
    modelName: 'Enrolled',
  });
  return Enrolled;
};