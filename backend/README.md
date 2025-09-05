# Backend-Teil / Backend Part – CRM

**API:** REST  
**ORM:** Prisma  
**Technologien / Tech Stack:** Node.js, Express  

## Prisma Client  
Im Ordner `generated/prisma-client` befinden sich die generierten Dateien für den **Prisma Client**.  
Diese werden benötigt, um die **Datentypen (Types)** für die **Entities** aus der Datenbank zu erhalten.  

## Daten generieren / Generate Data Types  
Um neue Typdefinitionen zu erstellen oder bestehende zu aktualisieren, bitte im **DB**-Projekt folgenden Befehl ausführen:  

```bash
npm run generate
```

💡 Hinweis / Note:
Der prisma-client wird automatisch aus dem Datenbankschema erstellt. Änderungen am Schema erfordern das erneute Ausführen des obigen Befehls.

Create admin in DB:
npx ts-node src/scripts/createAdmin.ts [Name] [email] [password]

Create employy in DB:
npx ts-node src/scripts/createEmployee.ts [Name] [email] [password]

## API Endpoints (group members batch)

The backend exposes batch endpoints for managing group members in bulk. All endpoints return the final list of group members (including user objects) on success.

- POST /groups/:groupId/members/batch
	- Purpose: Add multiple users to the group.
	- Body: JSON array of userId strings, e.g. `["user-1","user-2"]`.
	- Response: 200 OK with array of group members (each with included `user`).

- PUT /groups/:groupId/members/batch
	- Purpose: Replace the group's member set with the provided list of userIds (idempotent).
	- Body: JSON array of userId strings representing the final desired membership.
	- Response: 200 OK with array of group members (each with included `user`).

- DELETE /groups/:groupId/members/batch
	- Purpose: Remove multiple users from the group.
	- Body: JSON array of userId strings to remove.
	- Response: 200 OK with array of remaining group members.

These endpoints run the changes inside a transaction and return the authoritative members list which is convenient for client-side cache updates.

## Groups API (full)

Base path: `/groups`

- GET `/groups`
	- Purpose: List all groups (includes leader and members with user objects)
	- Response: 200 OK - array of groups

- POST `/groups`
	- Purpose: Create a new group
	- Body: `{ name: string, leaderId: string }`
	- Response: 201 Created - created group (includes leader and members)

- GET `/groups/:id`
	- Purpose: Get a group by id (includes leader and members with user objects)
	- Response: 200 OK - group object

- PUT `/groups/:id`
	- Purpose: Update group properties (name, leaderId)
	- Body: `{ name?: string, leaderId?: string }`
	- Response: 200 OK - updated group

- DELETE `/groups/:id`
	- Purpose: Delete a group
	- Response: 204 No Content

Member endpoints (single):

- GET `/groups/:id/members`
	- Purpose: List members of a group (with user objects)
	- Response: 200 OK - array of groupMember objects

- POST `/groups/:groupId/members`
	- Purpose: Add a single user to the group
	- Body: `{ userId: string }`
	- Response: 201 Created - created groupMember object

- DELETE `/groups/:groupId/members/:userId`
	- Purpose: Remove a single user from the group
	- Response: 204 No Content

Member endpoints (batch):

- POST `/groups/:groupId/members/batch` — Add multiple userIds (body: `string[]`)
- PUT `/groups/:groupId/members/batch` — Replace members with provided userId array (body: `string[]`)
- DELETE `/groups/:groupId/members/batch` — Remove provided userIds (body: `string[]`)

All batch endpoints return 200 OK with the final members array (each member includes the `user` object).
