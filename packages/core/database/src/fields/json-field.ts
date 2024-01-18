import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, FieldContext } from './field';

export class JsonField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const dialect = context.database.sequelize.getDialect();
    if (dialect === 'mssql') {
      super(
        {
          ...options,
          defaultValue: JSON.stringify(options.defaultValue),
        },
        context,
      );
    } else {
      super(options, context);
    }
  }

  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    const { jsonb } = this.options;
    if (dialect === 'postgres' && jsonb) {
      return DataTypes.JSONB;
    }
    if (dialect === 'mssql') {
      return DataTypes.TEXT;
    }
    return DataTypes.JSON;
  }
}

export interface JsonFieldOptions extends BaseColumnFieldOptions {
  type: 'json';
}

export class JsonbField extends Field {
  constructor(options?: any, context?: FieldContext) {
    const dialect = context.database.sequelize.getDialect();

    if (dialect === 'mssql') {
      super(
        {
          ...options,
          defaultValue: JSON.stringify(options.defaultValue),
        },
        context,
      );
    } else {
      super(options, context);
    }
  }

  get dataType() {
    const dialect = this.context.database.sequelize.getDialect();
    if (dialect === 'postgres') {
      return DataTypes.JSONB;
    }
    if (dialect === 'mssql') {
      return DataTypes.TEXT;
    }
    return DataTypes.JSON;
  }
}

export interface JsonbFieldOptions extends BaseColumnFieldOptions {
  type: 'jsonb';
}
