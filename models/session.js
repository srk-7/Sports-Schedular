'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Session.init({
    start: DataTypes.DATE,
    place: DataTypes.STRING,
    participants: DataTypes.ARRAY(DataTypes.STRING),
    playersrequired: DataTypes.INTEGER,
    sportid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};