const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'workpulse.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to the SQLite database: workpulse.db');
  }
});

// Initialize database schema
db.serialize(() => {
  // Create Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Create Reports Table
  db.run(`
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
    )
  `);

  // Seed default employees and admin if table is empty
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error("Error reading users count:", err.message);
      return;
    }

    if (row.count === 0) {
      console.log("Seeding default user accounts...");
      
      const insertUser = db.prepare("INSERT INTO users (id, name, department, role, password) VALUES (?, ?, ?, ?, ?)");
      
      // Admin
      insertUser.run("CODETHRIVE ADMIN", "System Admin", "Management", "ADMIN", "jiju@123");
      
      // Employees
      insertUser.run("EMP001", "Employee 1", "IT", "EMPLOYEE", "emp123");
      insertUser.run("EMP002", "Employee 2", "IT", "EMPLOYEE", "emp123");
      insertUser.run("EMP003", "Employee 3", "IT", "EMPLOYEE", "emp123");
      insertUser.run("EMP004", "Employee 4", "IT", "EMPLOYEE", "emp123");
      insertUser.run("EMP005", "Employee 5", "Non-IT", "EMPLOYEE", "emp123");
      insertUser.run("EMP006", "Employee 6", "Non-IT", "EMPLOYEE", "emp123");
      
      insertUser.finalize();
      console.log("Users seeding complete.");
    }
    
    // Always ensure CodeThrive Admin exists with the current password
    db.run(
      "INSERT OR REPLACE INTO users (id, name, department, role, password) VALUES (?, ?, ?, ?, ?)",
      ["CODETHRIVE ADMIN", "System Admin", "Management", "ADMIN", "jiju@123"]
    );
  });
});

module.exports = db;
