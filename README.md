# GM Promoters - Land Management System

A comprehensive Land Promotion Company Database Management System built with Node.js, Express, and SQLite/PostgreSQL.

<img width="1140" height="714" alt="image" src="https://github.com/user-attachments/assets/6b7ade7e-0bd2-459a-9c4a-c65b2fe9e87e" />


## Features

### Authentication & Authorization
- User login and registration
- Password hashing with bcrypt
- Session-based authentication
- Role-based access control (Admin / Agent / Staff)

### Land Management
- Add, edit, delete land records
- Track land status (Available / Reserved / Sold)
- Assign agents to lands
- Document uploads
- Search and filter by location, price, status, type

### Customer Management
- Complete customer profiles
- ID proof documentation
- Purchase history tracking
- Link customers to purchased lands

### Agent Management
- Agent profiles with commission rates
- Track assigned lands and sales
- Commission calculator
- Performance metrics

### Transactions
- Record purchase transactions
- Multiple payment methods (Cash, Cheque, Bank Transfer, UPI)
- Installment tracking
- Receipt generation
- Commission tracking

### Reports & Analytics
- Dashboard with key metrics
- Monthly sales charts
- Top performing agents
- Land status distribution
- Revenue summaries

### Additional Features
- Global search across all entities
- CSV export functionality
- Activity logging / Audit trail
- Responsive design
- Toast notifications
- Confirmation dialogs

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** SQLite (default) / PostgreSQL
- **ORM:** Sequelize
- **Authentication:** express-session, bcryptjs
- **File Upload:** Multer

## 📁 Project Structure

```
GMpromoters/
├── config/
│   └── database.js         # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── activityLogger.js   # Activity logging
│   └── upload.js           # File upload config
├── models/
│   ├── index.js            # Model relationships
│   ├── User.js
│   ├── Land.js
│   ├── Customer.js
│   ├── Agent.js
│   ├── Transaction.js
│   ├── AgentLandAssignment.js
│   └── ActivityLog.js
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── lands.js            # Land management
│   ├── customers.js        # Customer management
│   ├── agents.js           # Agent management
│   ├── transactions.js     # Transaction handling
│   ├── reports.js          # Reports & analytics
│   ├── search.js           # Global search
│   ├── users.js            # User management
│   └── export.js           # CSV export
├── public/
│   ├── css/
│   │   ├── styles.css      # Main styles
│   │   ├── dashboard.css   # Dashboard layout
│   │   └── components.css  # UI components
│   ├── js/
│   │   ├── api.js          # API service
│   │   ├── utils.js        # Utility functions
│   │   ├── components.js   # UI components
│   │   ├── app.js          # Main app
│   │   └── pages/          # Page modules
│   └── index.html          # Main HTML
├── scripts/
│   ├── init-db.js          # Database initialization
│   └── seed-data.js        # Sample data seeder
├── database/               # SQLite database files
├── uploads/                # Uploaded files
├── server.js               # Express server
├── package.json
├── .env                    # Environment config
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd GMpromoters
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npm run init-db
   ```
   This creates the database tables and a default admin user.

4. **Seed sample data (optional):**
   ```bash
   npm run seed
   ```
   This adds sample lands, customers, agents, and transactions.

5. **Start the server:**
   ```bash
   npm run dev   # Development with auto-reload
   # or
   npm start     # Production
   ```

6. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Default Login Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | admin    | admin123 |
| Agent | john_agent | agent123 |
| Staff | jane_staff | staff123 |

## Environment Variables

Create a `.env` file (already included with defaults):

```env
# Server
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=your-secret-key

# Database (sqlite or postgres)
DB_TYPE=sqlite
SQLITE_PATH=./database/gm_promoters.db

# PostgreSQL (if DB_TYPE=postgres)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=gm_promoters
# DB_USER=postgres
# DB_PASSWORD=your_password

# Defaults
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@gmpromoters.com
```

## Database Schema

### Tables

- **users** - System users with roles
- **lands** - Land property records
- **customers** - Customer information
- **agents** - Sales agent profiles
- **transactions** - Payment records
- **agent_land_assignments** - Agent-Land relationships
- **activity_logs** - Audit trail

### Key Relationships

- Land → Agent (Many-to-Many via assignments)
- Land → Primary Agent (Many-to-One)
- Transaction → Land, Customer, Agent
- Land → Customer (purchased by)

## Role Permissions

| Feature | Admin | Agent | Staff |
|---------|-------|-------|-------|
| View Dashboard | ✅ | ✅ | ✅ |
| Manage Lands | ✅ | ✅ | Read |
| Manage Customers | ✅ | ✅ | Read |
| Manage Agents | ✅ | ❌ | ❌ |
| Manage Transactions | ✅ | ✅ | Read |
| View Reports | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |
| Activity Log | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ |

