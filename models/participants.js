'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class participants extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  participants.init({
    pname: DataTypes.STRING,
    sessionid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'participants',
  });
  return participants;
};