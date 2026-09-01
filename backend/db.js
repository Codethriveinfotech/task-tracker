const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Initialize database schema
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    department TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    date TEXT NOT NULL,
    day TEXT NOT NULL,
    workDone TEXT NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT NOT NULL,
    auditLog TEXT,
    FOREIGN KEY (employeeId) REFERENCES users (id)
  );
`)
  .then(() => {
    console.log('PostgreSQL schema initialized.');

    // Seed default admin if missing
    return pool.query("SELECT COUNT(*) as count FROM users").then(res => {
      const count = parseInt(res.rows[0].count, 10);
      if (count === 0) {
        console.log("Seeding default user accounts...");
        return pool.query(`
          INSERT INTO users (id, name, department, role, password) VALUES 
          ('CODETHRIVE ADMIN', 'System Admin', 'Management', 'ADMIN', 'jiju@123'),
          ('EMP001', 'Employee 1', 'IT', 'EMPLOYEE', 'emp123'),
          ('EMP002', 'Employee 2', 'IT', 'EMPLOYEE', 'emp123'),
          ('EMP003', 'Employee 3', 'IT', 'EMPLOYEE', 'emp123'),
          ('EMP004', 'Employee 4', 'IT', 'EMPLOYEE', 'emp123'),
          ('EMP005', 'Employee 5', 'Non-IT', 'EMPLOYEE', 'emp123'),
          ('EMP006', 'Employee 6', 'Non-IT', 'EMPLOYEE', 'emp123')
        `);
      } else {
        // Always ensure CodeThrive Admin exists with the current password
        return pool.query(`
          INSERT INTO users (id, name, department, role, password) 
          VALUES ('CODETHRIVE ADMIN', 'System Admin', 'Management', 'ADMIN', 'jiju@123')
          ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, department = EXCLUDED.department, role = EXCLUDED.role
        `);
      }
    });
  })
  .then(() => {
    console.log("Connected and seeded PostgreSQL database successfully.");
  })
  .catch((err) => {
    console.error('Error initializing PostgreSQL database:', err.message);
  });

module.exports = pool;
