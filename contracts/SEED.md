# Seed data

`POST /__test__/reset?size=small|large` (only when `BD_TEST_MODE=1`) wipes the
database and loads one of the two datasets below. BetterDev's hidden checks call
it before each test module, so **both backends must produce exactly this data**.

Every seeded user's password is `password123`.

## `size=small` — `seed.json`

Load the file as-is, keeping its ids. It has users, teams, team members,
projects, project teams, project members and tasks. The starter only loads the
parts it has tables for (users, teams, team members); when you build projects
and tasks, extend the seeder to load the rest.

| email | role | notes |
|---|---|---|
| alice@example.com | admin | lead of Team Marvin, admin of Project Atlas |
| bob@example.com | member | in two teams and two projects |
| carol@example.com | member | lead of Team Nova, admin of Project Beacon |
| dave@example.com | member | admin of Project Comet |
| erin@example.com | member | |
| frank@example.com | member | lead of Team Orbit |

## `size=large` — generated

Deterministic, no randomness, so both backends generate the same rows. Start from
the **small** seed, then append (ids continue from the small seed's max):

- **Users** `n = 1..500`: email `user{n}@example.com`, firstName `User`,
  lastName `{n}`, displayName `User {n}`, role `member`.
- **Teams** `n = 1..40`: name `Team {n:03}` (e.g. `Team 007`), description `''`.
  Members: large users `u` where `u % 40 == n % 40`; the smallest such `u` is the
  `lead`, the rest `member`.
- **Projects** `n = 1..100`: name `Project {n:03}`, description `''`, status
  `['planned','active','on_hold','done'][n % 4]`, teamIds `[large team (n % 40) + 1]`.
  Members: the members of that team, with the team lead as project `admin` and
  everyone else `member`.
- **Tasks** `n = 1..20000`: project = large project `(n % 100) + 1`, title
  `Task {n}`, description `''`,
  status `['todo','in_progress','review','done'][n % 4]`,
  priority `['low','medium','high','urgent'][(n // 4) % 4]`,
  assignee = the project's members sorted by userId, index `n % memberCount`,
  dueDate `2025-01-01 + (n % 120) days`,
  createdAt `2025-01-01T00:00:00Z + n minutes` (updatedAt the same), version 1.

`//` is integer division. All timestamps UTC; users, teams and projects use
`2025-01-01T00:00:00Z` for createdAt/updatedAt. "Large team `k`" / "large project
`k`" means the `k`-th generated one, so its id is the small seed's max id + `k`
(large project 1 is id 4, large task 1 is id 13). No activity rows are seeded —
the feed starts empty after every reset.

The starter's seeders load users and teams only. Projects and tasks (small and
large) load once you extend the seeder — be-crud needs the small projects,
be-api-design the small tasks, and be-profile the large projects and tasks.

The large seed exists to make shortcuts visible: an N+1 query, a missing index
or an unpaginated list that is fine with 12 tasks falls over with 20,000.
