# Work with API

Build a simple full-stack application
A frontend built with any modern framework or library (e.g., React, Vue, Angular, Svelte).
A backend server built with Node.js that manages articles by storing and retrieving them from files.

### Backend

```bash
cd backend
npm install

```
Create `.env` in backend/:
        DB_HOST=localhost
        DB_USER=root
        DB_PASS=your_password
        DB_NAME=articles_db
        DB_DIALECT=mysql
        PORT=5000
Run migrations:
```bash
npm db:create
npm db:migrate
```
Start backend:
```bash
npm start
```
### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
project-root/
├─ backend/             # Node.js backend
│  ├─ models/           # Sequelize models
│  ├─ routes/           # API routes (articles, comments, workspaces)
│  ├─ modules/          # Business logic: comments, notifications, attachments
│  ├─ uploads/          # Uploaded files
│  └─ index.js         # Entry point
├─ frontend/            # React app
│  ├─ src/
│  └─ ...
├─ data/                # Optional: sample data
└─ README.md    
```

## Technologies

* Node.js
* Express
* React

