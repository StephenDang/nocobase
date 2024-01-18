import { ArrayField } from './array-field';
import { BaseColumnFieldOptions } from './field';

export interface SetFieldOptions extends BaseColumnFieldOptions {
  type: 'set';
}

export class SetField extends ArrayField {
  beforeSave = (model) => {
    const oldValue = model.get(this.options.name);
    if (oldValue) {
      const dialect = this.context.database.sequelize.getDialect();
      if (dialect === 'mssql' && typeof oldValue === 'string') {
        const newValue = JSON.stringify([...new Set(JSON.parse(oldValue))]);
        model.set(this.options.name, newValue);
      } else {
        model.set(this.options.name, [...new Set(oldValue)]);
      }
    }
  };

  bind() {
    super.bind();
    this.on('beforeSave', this.beforeSave);
  }

  unbind() {
    super.unbind();
    this.off('beforeSave', this.beforeSave);
  }
}
