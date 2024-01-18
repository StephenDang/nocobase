import Database, { Model } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import _ from 'lodash';
const Dottie = require('dottie');

const setTargetKey = (db: Database, model: Model) => {
  if (model.get('targetKey')) {
    return;
  }
  const target = model.get('target') as any;
  if (db.hasCollection(target)) {
    const targetModel = db.getCollection(target).model;
    model.set('targetKey', targetModel.primaryKeyAttribute || 'id');
  } else {
    model.set('targetKey', 'id');
  }
};

const setSourceKey = (db: Database, model: Model) => {
  if (model.get('sourceKey')) {
    return;
  }
  const source = model.get('collectionName') as any;
  if (db.hasCollection(source)) {
    const sourceModel = db.getCollection(source).model;
    model.set('sourceKey', sourceModel.primaryKeyAttribute || 'id');
  } else {
    model.set('sourceKey', 'id');
  }
};

const getMagicAttribute = (database: Database, model: Model) => {
  const collection = database.getCollection(model.constructor.name);
  return collection.options.magicAttribute || 'options';
};

export const beforeInitOptions = {
  belongsTo(model: Model, { database }) {
    const dialect = database.sequelize.getDialect();
    let magicAttribute;
    if (dialect === 'mssql') {
      magicAttribute = getMagicAttribute(database, model);
      Dottie.set(model.dataValues, magicAttribute, JSON.parse(model.get(magicAttribute)));
    }

    const defaults = {
      // targetKey: 'id',
      foreignKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setTargetKey(database, model);

    if (dialect === 'mssql') {
      Dottie.set(model.dataValues, magicAttribute, JSON.stringify(model.get(magicAttribute)));
    }
  },
  belongsToMany(model: Model, { database }) {
    const dialect = database.sequelize.getDialect();
    let magicAttribute;
    if (dialect === 'mssql') {
      magicAttribute = getMagicAttribute(database, model);
      Dottie.set(model.dataValues, magicAttribute, JSON.parse(model.get(magicAttribute)));
    }

    const defaults = {
      // targetKey: 'id',
      // sourceKey: 'id',
      through: `t_${uid()}`,
      foreignKey: `f_${uid()}`,
      otherKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setTargetKey(database, model);
    setSourceKey(database, model);

    if (dialect === 'mssql') {
      Dottie.set(model.dataValues, magicAttribute, JSON.stringify(model.get(magicAttribute)));
    }
  },
  hasMany(model: Model, { database }) {
    const dialect = database.sequelize.getDialect();
    let magicAttribute;
    if (dialect === 'mssql') {
      magicAttribute = getMagicAttribute(database, model);
      Dottie.set(model.dataValues, magicAttribute, JSON.parse(model.get(magicAttribute)));
    }

    const defaults = {
      // targetKey: 'id',
      // sourceKey: 'id',
      foreignKey: `f_${uid()}`,
      target: `t_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setTargetKey(database, model);
    setSourceKey(database, model);
    if (model.get('sortable') && model.get('type') === 'hasMany') {
      model.set('sortBy', model.get('foreignKey') + 'Sort');
    }

    if (dialect === 'mssql') {
      Dottie.set(model.dataValues, magicAttribute, JSON.stringify(model.get(magicAttribute)));
    }
  },
  hasOne(model: Model, { database }) {
    const dialect = database.sequelize.getDialect();
    let magicAttribute;
    if (dialect === 'mssql') {
      magicAttribute = getMagicAttribute(database, model);
      Dottie.set(model.dataValues, magicAttribute, JSON.parse(model.get(magicAttribute)));
    }

    const defaults = {
      // sourceKey: 'id',
      foreignKey: `f_${uid()}`,
    };
    for (const key in defaults) {
      if (model.get(key)) {
        continue;
      }
      model.set(key, defaults[key]);
    }
    setSourceKey(database, model);

    if (dialect === 'mssql') {
      Dottie.set(model.dataValues, magicAttribute, JSON.stringify(model.get(magicAttribute)));
    }
  },
};
