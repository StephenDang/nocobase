import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field, FieldContext } from './field';

export class ArrayField extends Field {
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
    const dialect = this.database.sequelize.getDialect();
    if (dialect === 'postgres') {
      return DataTypes.JSONB;
    }
    if (dialect === 'mssql') {
      return DataTypes.TEXT;
    }

    return DataTypes.JSON;
  }

  sortValue = (model) => {
    const oldValue = model.get(this.options.name);

    if (oldValue) {
      const dialect = this.database.sequelize.getDialect();
      if (dialect === 'mssql' && typeof oldValue === 'string') {
        const newValue = JSON.stringify(JSON.parse(oldValue).sort());
        model.set(this.options.name, newValue);
      } else {
        const newValue = oldValue.sort();
        model.set(this.options.name, newValue);
      }
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.sortValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.sortValue);
  }
}

export interface ArrayFieldOptions extends BaseColumnFieldOptions {
  type: 'array';
}
