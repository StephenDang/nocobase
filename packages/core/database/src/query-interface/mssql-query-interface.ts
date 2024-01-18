import { Transaction, Transactionable } from 'sequelize';
import { Collection } from '../collection';
import sqlParser from '../sql-parser';
import QueryInterface, { TableInfo } from './query-interface';

export default class MSSqlQueryInterface extends QueryInterface {
  constructor(db) {
    super(db);
  }

  async collectionTableExists(collection: Collection, options?: Transactionable) {
    const transaction = options?.transaction;

    const tableName = collection.model.tableName;
    const schema = collection.collectionSchema() || 'dbo';

    const sql = `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = '${schema}'
      AND TABLE_NAME = '${tableName}';
    `;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT', transaction });
    return results.length > 0;
  }

  async listViews() {
    const sql = `
    SELECT
      name,
      schema_name(schema_id) as 'schema'
    FROM sys.views
    ORDER BY 'schema', name;
    `;

    return await this.db.sequelize.query(sql, { type: 'SELECT' });
  }

  async viewColumnUsage(options: { viewName: string; schema?: string }): Promise<{
    [view_column_name: string]: {
      column_name: string;
      table_name: string;
      table_schema?: string;
    };
  }> {
    try {
      const { ast } = this.parseSQL(await this.viewDef(options.viewName));
      const columns = ast.columns;

      const results = [];
      for (const column of columns) {
        if (column.expr.type === 'column_ref') {
          results.push([
            column.as || column.expr.column,
            {
              column_name: column.expr.column,
              table_name: column.expr.table,
            },
          ]);
        }
      }

      return Object.fromEntries(results);
    } catch (e) {
      this.db.logger.warn(e);

      return {};
    }
  }

  parseSQL(sql: string): any {
    return sqlParser.parse(sql);
  }

  async viewDef(viewName: string): Promise<string> {
    const viewDefinition = await this.db.sequelize.query(`SHOW CREATE VIEW ${viewName}`, { type: 'SELECT' });
    const createView = viewDefinition[0]['Create View'];
    const regex = /(?<=AS\s)([\s\S]*)/i;
    const match = createView.match(regex);
    const sql = match[0];

    return sql;
  }

  async showTableDefinition(tableInfo: TableInfo): Promise<any> {
    const { tableName } = tableInfo;

    const sql = `
    select
      'create table [' + so.name + '] (' + o.list + ')' + CASE
        WHEN tc.Constraint_Name IS NULL THEN ''
        ELSE 'ALTER TABLE ' + so.Name + ' ADD CONSTRAINT ' + tc.Constraint_Name + ' PRIMARY KEY ' + ' (' + LEFT(j.List,
        Len(j.List)-1) + ')'
      END
    from
      sysobjects so
    cross apply
        (
      SELECT
        '  [' + column_name + '] ' + 
            data_type + case
          data_type
                when 'sql_variant' then ''
          when 'text' then ''
          when 'ntext' then ''
          when 'xml' then ''
          when 'decimal' then '(' + cast(numeric_precision as varchar) + ', ' + cast(numeric_scale as varchar) + ')'
          else coalesce('(' + case
            when character_maximum_length = -1 then 'MAX'
            else cast(character_maximum_length as varchar)
          end + ')',
          '')
        end + ' ' +
            case
          when exists (
          select
            id
          from
            syscolumns
          where
            object_name(id)= so.name
            and name = column_name
            and columnproperty(id,
            name,
            'IsIdentity') = 1 
            ) then
            'IDENTITY(' + 
            cast(ident_seed(so.name) as varchar) + ',' + 
            cast(ident_incr(so.name) as varchar) + ')'
          else ''
        end + ' ' +
            (case
          when UPPER(IS_NULLABLE) = 'NO' then 'NOT '
          else ''
        end ) + 'NULL ' + 
              case
          when information_schema.columns.COLUMN_DEFAULT IS NOT NULL THEN 'DEFAULT ' + information_schema.columns.COLUMN_DEFAULT
          ELSE ''
        END + ', ' 
    
        from information_schema.columns where table_name = so.name
        order by ordinal_position
        FOR XML PATH('')) o (list)
    left join
        information_schema.table_constraints tc
    on  tc.Table_name       = so.Name
    AND tc.Constraint_Type  = 'PRIMARY KEY'
    cross apply
        (select '[' + Column_Name + '], '
        FROM   information_schema.key_column_usage kcu
        WHERE  kcu.Constraint_Name = tc.Constraint_Name
        ORDER BY
            ORDINAL_POSITION
        FOR XML PATH('')) j (list)
    where   xtype = 'U'
    AND name = '${tableName}'  
    `;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT' });
    return results[0];
  }

  async getAutoIncrementInfo(options: {
    tableInfo: TableInfo;
    fieldName: string;
  }): Promise<{ seqName?: string; currentVal: number }> {
    const { tableInfo, fieldName } = options;

    const sql1 = `SELECT AUTO_INCREMENT as currentVal
                 FROM information_schema.tables
                 WHERE table_schema = DATABASE()
                   AND table_name = '${tableInfo.tableName}';`;
    const sql = `SELECT IDENT_CURRENT('oai') AS currentVal;`;

    const results = await this.db.sequelize.query(sql, { type: 'SELECT' });

    let currentVal = results[0]['currentVal'] as number;

    if (currentVal === null) {
      // use max value of field instead
      const maxSql = `SELECT MAX(${fieldName}) as currentVal
                      FROM ${tableInfo.tableName};`;
      const maxResults = await this.db.sequelize.query(maxSql, { type: 'SELECT' });
      currentVal = maxResults[0]['currentVal'] as number;
    }

    return { currentVal };
  }

  async setAutoIncrementVal(options: {
    tableInfo: TableInfo;
    columnName: string;
    seqName?: string;
    currentVal: number;
    transaction?: Transaction;
  }): Promise<void> {
    const { tableInfo, columnName, seqName, currentVal, transaction } = options;

    const sql = `ALTER TABLE ${tableInfo.tableName} AUTO_INCREMENT = ${currentVal};`;
    await this.db.sequelize.query(sql, { transaction });
  }
}
