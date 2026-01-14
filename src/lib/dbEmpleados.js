import mysql from 'mysql2/promise';

const poolEmpleados = mysql.createPool({
  host: process.env.EMPLEADOS_DB_HOST || process.env.DB_HOST,
  port: parseInt(process.env.EMPLEADOS_DB_PORT || process.env.DB_PORT) || 3306,
  user: process.env.EMPLEADOS_DB_USER || process.env.DB_USER,
  password: process.env.EMPLEADOS_DB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.EMPLEADOS_DB_NAME || 'empleados',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function queryEmpleados(sql, params) {
  const [results] = await poolEmpleados.execute(sql, params);
  return results;
}

export default poolEmpleados;

