require('dotenv').config();
const app = require('./app');
const pool = require('./models/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await pool.query('SELECT 1'); // Verify DB connection
    console.log('PostgreSQL connected.');
    app.listen(PORT, () => {
      console.log(`ASPO Larkana backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
}

start();
