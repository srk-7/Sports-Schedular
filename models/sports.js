'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sports.init({
    name: DataTypes.STRING,
    adminid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Sports',
  });
  return Sports;
};