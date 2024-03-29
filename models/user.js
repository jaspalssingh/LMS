'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Enrolled, {
        foreignKey: "userid",
      })
    }
    static adduser(firstName, lastName, email, hashedPwd) {
      this.create({
        firstName,
        lastName,
        email,
        hashedPwd,
        role: "user"
      })
    }

    static changepass(email, newpass) {
      console.log(email, newpass)
      return this.update({ password: newpass }, {
        where: {
          email: email
        }
      })
    }
  }

  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};