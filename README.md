# Team Management Dashboard

A feature-rich **Team & Project Management Dashboard** built with modern
frontend technologies.\
The purpose of this application is to simulate a real-world management
system where users, teams, projects, and tasks can be created, updated,
and linked together using relational-style data stored in **JSON
Server**.

This dashboard includes:

- Team management
- User management
- Project management
- Task tracking
- Activity logging
- Analytics dashboard
- Authentication simulation (client-only)

---

## Features

### Core Management

- Users CRUD
- Teams CRUD
- Projects CRUD
- Tasks CRUD
- Roles table (fully separate)
- Assigning users to teams & projects
- Assigning tasks to users

### Advanced Features

- Project admins & project members
- Task priorities and statuses
- Filters (team, project, role, status)
- Activity logging
- Dashboard analytics with charts

### Client-Side Authentication Simulation

- Fake login
- Role-based route guards
- Restricted project views

---

## Technologies Used

### **Frontend**

---

Technology Purpose Link

---

**React** UI framework https://react.dev/

**Vite** Build tool / dev server https://vitejs.dev/

**TypeScript** Strong typing https://www.typescriptlang.org/

**MUI (Material UI)** UI components https://mui.com/

**React Hook Form** Form state management https://react-hook-form.com/

**TanStack Query** Server-state management https://tanstack.com/query/latest

**Axios** HTTP client https://axios-http.com/

**React Router** Routing/navigation https://reactrouter.com/

---

---

### **Backend Simulation**

---

Technology Purpose Link

---

**JSON Server** Fake REST API https://github.com/typicode/json-server

**json-server-auth Auth simulation layer https://github.com/jeremyben/json-server-auth
(optional)**

---

---

### **Tooling / Dev Experience**

Tool Purpose Link

---

**ESLint** Code linting https://eslint.org/
**Prettier** Code formatting https://prettier.io/
**Vitest** Unit testing https://vitest.dev/

---

## Environment Variables

### `.env.example`

VITE_API_URL=http://localhost:4000

---

## 📦 How to Run the Project

```bash
npm install
npm run dev
```

Run JSON server:

```bash
npm run server
```

---

## 🧭 Roadmap

See full roadmap here:\
`TODOS.md` (feature-by-feature development plan)
