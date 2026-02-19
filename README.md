# Norm's Bucketlist

UNC Charlotte campus traditions tracker for students.

## Project Structure

- `/src` - Node.js/Express backend
- `/frontend` - React web app (Vite)
- `/tests` - Jest unit tests
- `/.github` - Project documentation

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- Prisma ORM
- Jest for testing
- dotenv for environment variables

**Frontend:**
- React + Vite
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (with pgAdmin)
- Git

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: This automatically generates the Prisma Client via postinstall script*

2. **Configure database:**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL credentials:
     ```
     DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/norms_bucketlist
     ```

3. **Set up PostgreSQL database:**
   - Open pgAdmin and start your PostgreSQL server
   - Create a database named `norms_bucketlist` (or match your DATABASE_URL)
   - Verify the server is running on port 5432 (or your configured port)

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```
   This creates all database tables (users, etc.) based on the Prisma schema

5. **Run tests:**
   ```bash
   npm test
   ```

6. **Start backend server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3000`

7. **Test endpoints:**
   - Home: `http://localhost:3000/`
   - Hello page: `http://localhost:3000/hello`
   - Database demo: `http://localhost:3000/db` (requires PostgreSQL running)

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

### Running Console App

```bash
npm run console
```

## Development

- Backend API: Port 3000
- Frontend dev server: Port 5173
- PostgreSQL: Port 5432

### Useful Database Commands

- `npm run db:migrate` - Create and apply new database migrations
- `npm run db:reset` - Reset database and apply all migrations (removes all data)
- `npm run db:studio` - Open Prisma Studio to view/edit database in browser
- `npm run db:push` - Push schema changes without creating migration files

## Environment Variables

Create a `.env` file in the root directory:

```
DATABASE_URL=postgresql://username:password@localhost:5432/norms_bucketlist
PORT=3000
```
