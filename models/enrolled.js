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
    static getenrolledcourses(userid) {
      return this.findAll({
        where: {
          userid: userid
        }
      })
    }
    static getcount(courseid, userid) {
      return this.findAll({
        where: {
          courseid: courseid,
        }
      });
    }
    static remove(id) {
      return this.destroy({
        where: {
          courseid: id
        }
      })
    }
    static remove_enroll(userid, courseid) {
      return this.destroy({
        where: {
          userid: userid,
          courseid: courseid
        }
      })
    }
    static getcoursesid() {
      return this.findAll();
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