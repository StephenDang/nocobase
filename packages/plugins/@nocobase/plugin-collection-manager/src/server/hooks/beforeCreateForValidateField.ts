import Database from '@nocobase/database';
const Dottie = require('dottie');

export function beforeCreateForValidateField(database: Database) {
  return async (model, { transaction }) => {
    if (model.type === 'belongsToMany') {
      const dialect = transaction.sequelize.getDialect();
      let magicAttribute;
      if (dialect === 'mssql') {
        const collection = database.getCollection(model.constructor.name);
        magicAttribute = collection.options.magicAttribute || 'options';
        Dottie.set(model.dataValues, magicAttribute, JSON.parse(model.get(magicAttribute)));
      }

      if (model.get('foreignKey') === model.get('otherKey')) {
        throw new Error('foreignKey and otherKey can not be the same');
      }

      if (dialect === 'mssql') {
        Dottie.set(model.dataValues, magicAttribute, JSON.stringify(model.get(magicAttribute)));
      }
    }
  };
}
