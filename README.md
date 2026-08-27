# WorkPulse - Employee Daily Work Reporting System

A complete, production-ready **Employee Daily Work Reporting System** built with **React**, **Vite**, **Tailwind CSS**, and **Google Sheets / Google Apps Script** backend.

---

## Key Features

- **6 Pre-configured Employee Accounts**: 4 IT employees (`EMP001` - `EMP004`) and 2 Non-IT employees (`EMP005` - `EMP006`).
- **Google Sheets Database**: Primary cloud storage utilizing **one Google Spreadsheet** containing **6 separate employee sheets** (e.g. `Employee 1`, `Employee 2`, ..., `Employee 6`).
- **Google Apps Script Backend**: Serverless API backend providing endpoint routing, token authentication, date validation, and spreadsheet mutation.
- **Hidden Sheet Access**: Employees submit reports via the web portal and never have direct edit access to the underlying Google Sheets.
- **Single Submission Guard**: Prevents duplicate daily report submissions per employee for the same calendar date.
- **Read-Only Past Data**: Submissions are read-only for employees. Edit and delete controls are strictly forbidden for employees.
- **Executive Admin Portal**:
  - Real-time submission status matrix (Total, Submitted Today, Pending, Status Breakdown).
  - Searchable & filterable reports master grid (by Employee, Date range, Status).
  - Admin report correction with mandatory audit trail log (`Modified By`, `Date/Time`, `Reason`).
  - Monthly aggregated summary per employee (Working days, Completed, In Progress, Pending, Leave, Holiday).
  - Multi-tab **Excel Export (.xlsx)** preserving the 6-employee sheet structure.
- **Dual Mode (Instant Offline / Mock Failover)**:
  - If `VITE_APPS_SCRIPT_URL` is set, calls live Google Sheets API via HTTP POST.
  - If `VITE_APPS_SCRIPT_URL` is empty, automatically falls back to an interactive browser state so you can test all workflows immediately out-of-the-box!

---

## 📁 Directory Structure

```text
employee-work-report/
├── frontend/
│   ├── .env.example              # Environment variables template
│   ├── index.html                # Entry point
│   ├── package.json              # React, Vite, Lucide Icons, XLSX
│   ├── vite.config.js            # Vite configuration
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Application router & layout
│       ├── index.css             # Glassmorphism dark mode design system
│       ├── config/
│       │   └── appConfig.js      # Employee roster & status configuration
│       ├── services/
│       │   └── apiService.js     # Apps Script API + Fallback Mock service
│       ├── context/
│       │   └── AuthContext.jsx   # Session management & token storage
│       ├── components/
│       │   ├── Navbar.jsx        # Branding & user profile header
│       │   ├── Sidebar.jsx       # Dynamic role-based navigation
│       │   ├── StatusBadge.jsx   # Color-coded status indicators
│       │   ├── Modal.jsx         # Reusable correction dialog
│       │   └── Toast.jsx         # Notification alert popup
│       └── pages/
│           ├── Login.jsx         # Dual Employee & Admin login page
│           ├── employee/
│           │   ├── EmployeeDashboard.jsx
│           │   ├── SubmitWork.jsx
│           │   └── MyHistory.jsx
│           └── admin/
│               ├── AdminDashboard.jsx
│               ├── AllReports.jsx
│               ├── MonthlySummary.jsx
│               └── SystemSettings.jsx
├── google-apps-script/
│   ├── Code.gs                   # Web App doPost/doGet router
│   ├── Authentication.gs         # Session token verification
│   ├── EmployeeReports.gs        # Submission & duplicate check logic
│   ├── AdminReports.gs           # All-reports query, admin edits, monthly summary
│   └── Configuration.gs          # Spreadsheet ID & default credentials
└── README.md
```

---

## 🛠️ Step 1: Google Sheets Setup

1. Open [Google Sheets](https://sheets.google.com/) and create a new blank spreadsheet named:
   ```text
   Employee Monthly Work Report
   ```
2. Create **6 separate sheet tabs** with the following exact names (or matching your employee names in `Configuration.gs`):
   - `Employee 1`
   - `Employee 2`
   - `Employee 3`
   - `Employee 4`
   - `Employee 5`
   - `Employee 6`
3. Add the following header row in **Row 1** of each sheet tab:
   | Column A | Column B | Column C | Column D | Column E | Column F | Column G |
   | --- | --- | --- | --- | --- | --- | --- |
   | Timestamp | Date | Day | Work Done / Activities | Status | Issues / Remarks | Audit Log |

4. Copy the **Spreadsheet ID** from your browser URL:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`

---

## ⚙️ Step 2: Google Apps Script Backend Deployment

1. Open [Google Apps Script](https://script.google.com/) and click **New project**.
2. Name the project `WorkPulse-Backend`.
3. Copy the code from the `google-apps-script/` directory into individual files in the Apps Script editor:
   - `Code.gs`
   - `Configuration.gs`
   - `Authentication.gs`
   - `EmployeeReports.gs`
   - `AdminReports.gs`
4. Open `Configuration.gs` and paste your Google Spreadsheet ID:
   ```javascript
   var CONFIG = {
     SPREADSHEET_ID: "YOUR_GOOGLE_SPREADSHEET_ID_HERE",
     ...
   };
   ```
5. Click **Deploy** > **New deployment**.
6. Click the gear icon (**Select type**) and choose **Web app**.
7. Configure deployment settings:
   - **Description**: `WorkPulse API v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial for frontend fetch requests)*
8. Click **Deploy**, review permissions, and grant access.
9. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/AKfycbx.../exec`).

---

## 💻 Step 3: Frontend Installation & Run

1. Navigate to the `frontend` folder in your terminal:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` and paste your deployed Google Apps Script URL:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
   ```
   *(If left blank, the app will run in full-featured Mock Mode for instant local testing).*
5. Start the local Vite development server:
   ```bash
   npm run dev
   ```
6. Build for production deployment:
   ```bash
   npm run build
   ```

---

## 🔑 Default Credentials

### Employee Accounts
- **EMP001**: `emp123` (Employee 1 - IT)
- **EMP002**: `emp123` (Employee 2 - IT)
- **EMP003**: `emp123` (Employee 3 - IT)
- **EMP004**: `emp123` (Employee 4 - IT)
- **EMP005**: `emp123` (Employee 5 - Non-IT)
- **EMP006**: `emp123` (Employee 6 - Non-IT)

### Admin Account
- **ADMIN001**: `admin123` (System Admin)

---

## 🧪 Step 4: Verification & Testing Scenarios

Follow this step-by-step test matrix to verify all project requirements:

### Test 1: Employee 1 Submission
1. Log in as `EMP001` / `emp123`.
2. Notice the auto-filled read-only **Employee 1** name and current date.
3. Submit work:
   - Work Done: `Completed website homepage UI.`
   - Status: `Completed`
4. Verify record appears in the **Employee 1 sheet tab**.

### Test 2: Employee 2 Submission
1. Log in as `EMP002` / `emp123`.
2. Submit a daily work report.
3. Verify it appears **only** in the **Employee 2 sheet tab**.

### Test 3: Duplicate Submission Guard
1. Log in as `EMP001` on the same day.
2. Attempt to submit a second report for today.
3. Verify system displays warning: *"You have already submitted today's work report."* and renders a read-only preview of today's submission.

### Test 4: Data Isolation
1. While logged in as `EMP001`, navigate to **My Work History**.
2. Verify you can only view Employee 1's records.

### Test 5: Employee Data Protection
1. Attempt to edit or delete historic reports as an employee.
2. Verify there are **no edit or delete controls** anywhere in the employee interface.

### Test 6: Admin Dashboard
1. Log in as `ADMIN001` / `admin123`.
2. Access the Admin Dashboard and verify overview metric cards (Total employees: 6, Submitted Today, Pending Today, Status breakdown) and today's employee submission status matrix.

### Test 7: Admin Filtering
1. Open **Daily Reports** in Admin Portal.
2. Apply filter: `Employee: Employee 3` and date range.
3. Verify grid filters down to only matching records.

### Test 8: Admin Correction & Audit Trail
1. In Admin Daily Reports, click **Edit / Correct** on any employee report.
2. Update status and provide a mandatory **Correction Reason**.
3. Save changes. Verify record updates and records audit log (`[Modified By Admin ADMIN001 at YYYY-MM-DD HH:mm:ss]`).

---

## ➕ How to Add a 7th Employee Later

1. **Google Apps Script Config** (`google-apps-script/Configuration.gs`):
   Add a new employee object to `CONFIG.EMPLOYEES`:
   ```javascript
   { id: "EMP007", name: "Employee 7", department: "IT", password: "emp123" }
   ```
2. **Frontend Config** (`frontend/src/config/appConfig.js`):
   Add the matching object to `DEFAULT_EMPLOYEES`:
   ```javascript
   { id: "EMP007", name: "Employee 7", department: "IT", role: "EMPLOYEE" }
   ```
3. **Google Sheets**:
   The backend auto-generates the `"Employee 7"` sheet tab on their first submission. No manual sheet creation required!
