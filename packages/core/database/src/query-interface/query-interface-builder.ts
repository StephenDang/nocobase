import Database from '../database';
import MSSqlQueryInterface from './mssql-query-interface';
import MysqlQueryInterface from './mysql-query-interface';
import PostgresQueryInterface from './postgres-query-interface';
import SqliteQueryInterface from './sqlite-query-interface';

export default function buildQueryInterface(db: Database) {
  const map = {
    mysql: MysqlQueryInterface,
    mariadb: MysqlQueryInterface,
    postgres: PostgresQueryInterface,
    sqlite: SqliteQueryInterface,
    mssql: MSSqlQueryInterface,
  };

  return new map[db.options.dialect](db);
}
