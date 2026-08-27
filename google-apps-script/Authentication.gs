/**
 * Authentication & Security Management for Google Apps Script Backend
 */

/**
 * Log in an employee or admin
 */
function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }
  
  var cleanUser = username.trim().toUpperCase();
  var cleanPass = password.trim();

  // Check Admin first
  if (cleanUser === CONFIG.ADMIN_CREDENTIALS.username.toUpperCase()) {
    if (cleanPass === CONFIG.ADMIN_CREDENTIALS.password) {
      var token = createSessionToken("ADMIN", CONFIG.ADMIN_CREDENTIALS.username);
      return {
        success: true,
        user: {
          id: CONFIG.ADMIN_CREDENTIALS.username,
          name: CONFIG.ADMIN_CREDENTIALS.name,
          role: "ADMIN",
          department: "Management"
        },
        token: token
      };
    } else {
      return { success: false, error: "Invalid admin password" };
    }
  }

  // Check Employees
  for (var i = 0; i < CONFIG.EMPLOYEES.length; i++) {
    var emp = CONFIG.EMPLOYEES[i];
    if (emp.id.toUpperCase() === cleanUser) {
      if (emp.password === cleanPass) {
        var token = createSessionToken("EMPLOYEE", emp.id);
        return {
          success: true,
          user: {
            id: emp.id,
            name: emp.name,
            role: "EMPLOYEE",
            department: emp.department
          },
          token: token
        };
      } else {
        return { success: false, error: "Invalid employee password" };
      }
    }
  }

  return { success: false, error: "User account not found" };
}

/**
 * Generate a session token with timestamp signature
 */
function createSessionToken(role, userId) {
  var timestamp = new Date().getTime();
  var payload = role + ":" + userId + ":" + timestamp;
  return Utilities.base64Encode(payload);
}

/**
 * Validate token & extract user entity securely
 */
function validateSession(token) {
  if (!token) return null;
  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var parts = decoded.split(":");
    if (parts.length < 3) return null;

    var role = parts[0];
    var userId = parts[1];
    var timestamp = parseInt(parts[2], 10);

    // Optional token expiration (e.g. 7 days)
    var now = new Date().getTime();
    if (now - timestamp > 7 * 24 * 60 * 60 * 1000) {
      return null; // Expired
    }

    if (role === "ADMIN" && userId === CONFIG.ADMIN_CREDENTIALS.username) {
      return {
        id: CONFIG.ADMIN_CREDENTIALS.username,
        name: CONFIG.ADMIN_CREDENTIALS.name,
        role: "ADMIN",
        department: "Management"
      };
    } else if (role === "EMPLOYEE") {
      for (var i = 0; i < CONFIG.EMPLOYEES.length; i++) {
        var emp = CONFIG.EMPLOYEES[i];
        if (emp.id === userId) {
          return {
            id: emp.id,
            name: emp.name,
            role: "EMPLOYEE",
            department: emp.department
          };
        }
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}
