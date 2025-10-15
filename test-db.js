const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/lifehandler',
});

async function test() {
  try {
    const result = await pool.query('SELECT username, password FROM users WHERE username = $1', ['klemen']);
    console.log('User found:', result.rows);

    if (result.rows.length > 0) {
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare('ks15scss', result.rows[0].password);
      console.log('Password valid:', isValid);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
