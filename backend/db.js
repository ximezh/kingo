import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'kingo',
  max: 15,
  idleTimeoutMillis: 30000
})

export async function verificarConexionDB() {
  const client = await pool.connect()
  try {
    const res = await client.query('SELECT current_database() AS db, NOW() AS ahora')
    return res.rows[0]
  } finally {
    client.release()
  }
}
