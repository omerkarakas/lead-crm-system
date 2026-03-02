# PocketBase API Rules

This document contains the API rules that should be configured in PocketBase Admin UI for each collection.

## Users Collection Rules

The `users` collection (auth collection) should have the following API rules configured in PocketBase Admin UI:

### Create Rule
```
@request.auth.role = "admin"
```
Only admins can create new users.

### Read Rule
```
id = @request.auth.id || @request.auth.role = "admin"
```
Users can read their own profile, admins can read all users.

### Update Rule
```
id = @request.auth.id || @request.auth.role = "admin"
```
Users can update their own profile (except role field via API rule), admins can update all users.

### Delete Rule
```
@request.auth.role = "admin"
```
Only admins can delete users.

---

## Sessions Collection Rules

The `sessions` collection should have the following API rules:

### Create Rule
```
@request.auth.id = userId
```
Authenticated users can create sessions for themselves only.

### Read Rule
```
@request.auth.id = userId
```
Users can only read their own sessions.

### Update Rule
```
@request.auth.id = userId
```
Users can only update their own sessions.

### Delete Rule
```
@request.auth.id = userId
```
Users can only delete their own sessions.

---

## Leads Collection Rules

### Create Rule
```
@request.auth.id != ""
```
Any authenticated user can create leads.

### Read Rule
```
@request.auth.role = "admin" || @request.auth.role = "sales" || @request.auth.role = "marketing" || createdBy = @request.auth.id
```
Admins, Sales, and Marketing can view all leads. Users can view leads they created.

### Update Rule
```
@request.auth.role = "admin" || createdBy = @request.auth.id
```
Admins can update all leads. Users can update leads they created.

### Delete Rule
```
@request.auth.role = "admin" || createdBy = @request.auth.id
```
Admins can delete all leads. Users can delete leads they created.

---

## Notes Collection Rules

### Create Rule
```
@request.auth.id != ""
```
Any authenticated user can create notes.

### Read Rule
```
@request.auth.id = userId || @request.auth.role = "admin"
```
Users can read their own notes. Admins can read all notes.

### Update Rule
```
@request.auth.id = userId || @request.auth.role = "admin"
```
Users can update their own notes. Admins can update all notes.

### Delete Rule
```
@request.auth.id = userId || @request.auth.role = "admin"
```
Users can delete their own notes. Admins can delete all notes.

---

## Tags Collection Rules

### Create Rule
```
@request.auth.role = "admin" || @request.auth.role = "marketing"
```
Admins and Marketing users can create tags.

### Read Rule
```
@request.auth.id != ""
```
Any authenticated user can view tags.

### Update Rule
```
@request.auth.role = "admin" || @request.auth.role = "marketing"
```
Admins and Marketing users can update tags.

### Delete Rule
```
@request.auth.role = "admin" || @request.auth.role = "marketing"
```
Admins and Marketing users can delete tags.

---

## Setup Instructions

1. Open PocketBase Admin UI (usually at `http://localhost:8090/_/`)
2. Go to Settings -> Collections
3. Select the collection (e.g., `users`)
4. Click on the "API Rules" tab
5. Copy and paste the rules above for each operation (Create, Read, Update, Delete)
6. Click "Save"

## Important Notes

- These rules work in conjunction with frontend permission checks
- Frontend checks (`usePermission`) provide UX (hide/disable features)
- Backend rules (PocketBase API rules) provide security enforcement
- Always implement both layers for proper security
