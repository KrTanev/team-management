## Phase 1 — Core Data Models with JSON Server

- Configure JSON Server with the following tables: **users**, **teams**, **projects**, **tasks**
- CRUD for **Users**
  - Create/edit/delete
  - Validate unique email
  - Auto-generate `displayName` from first/last name if not provided
- CRUD for **Teams**
  - Assign/unassign members
  - Optional: assign team lead
- CRUD for **Projects**
  - Users can create projects
  - Assign admins and members
  - Attach teams to projects (`teamIds`)
  - Projects visible only to admins and members
- CRUD for **Tasks**
  - Tasks reference `projectId` and `assignedUserId`
- Handle timestamps (`createdAt`, `updatedAt`)
- Display relational data using TanStack Query

## Phase 2 — Team & Project Management Features

- **Team detail page** with members management
- **Project detail page**
  - Show admins, members, teams, and project tasks
- **User profile view**
  - Tasks assigned to the user
  - Projects user participates in
- Filtering/search by team, project, user
- Assign/unassign users to teams and projects

## Phase 3 — Tasks Module

- Full CRUD task management
- Task form with:
  - Title, description
  - Status
  - Priority
  - Assigned user
  - Linked project
- Task list filtering:
  - By project, user, team, status, priority
- Sorting and inline UX improvements

## Phase 4 — Activity Logging

- Create `activity_log` table
- Log events:
  - User changes
  - Team updates
  - Project changes
  - Task creation and status updates
- Activity Feed UI with timestamps and links

## Phase 5 — Authentication Simulation (Client-Only)

- Fake login page (RHF)
- Credentials validated via JSON Server users
- Store auth session in localStorage
- AuthContext for global state
- Protected Routes using react-router
- Access control for projects

## Phase 6 — Dashboard UI & Analytics

- Dashboard home page
- Summary cards:
  - users, teams, projects, tasks
- Workload analytics:
  - tasks per user, team, project
- Charts for:
  - project status
  - task priority
  - future: roles distribution

## Phase 7 — External API Integration (Future)

- Import external users or tasks
- Sync external data into `tasks` or `users`
- Merge external API responses with local db.json
