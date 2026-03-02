# PocketBase Collections Setup

This document describes the required PocketBase collections for Moka CRM.

## Users Collection

The `users` collection stores user accounts and authentication information.

### Fields

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | text (auto) | Yes | Yes | - | Auto-generated ID |
| email | email | Yes | Yes | - | User email address |
| name | text | Yes | No | - | User display name |
| password | password | Yes | No | - | User password (hashed) |
| role | select | Yes | No | sales | User role (admin, sales, marketing) |
| avatar | file | No | No | - | Profile picture |
| created | date | Yes | No | now | Creation timestamp |
| updated | date | Yes | No | now | Last update timestamp |

### Role Options

- `admin` - Full system access
- `sales` - Sales team access
- `marketing` - Marketing team access

### API Rules

| Rule | Create | Read | Update | Delete |
|------|--------|------|--------|--------|
| **Public** | ✅ | ❌ | ❌ | ❌ |
| **Authenticated** | ❌ | ✅ (own) | ✅ (own) | ✅ (own) |
| **Admin** | ✅ | ✅ (all) | ✅ (all) | ✅ (all) |

### Rule Details

**Create Rule:**
- Public: Allow (for user registration)
- This allows anyone to create a new user account

**Read Rule:**
- `id = @request.auth.id` (regular users)
- Empty for admins (allows reading all records)

**Update Rule:**
- `id = @request.auth.id` (regular users)
- Empty for admins (allows updating all records)

**Delete Rule:**
- `id = @request.auth.id` (regular users)
- Empty for admins (allows deleting all records)

### Setup Instructions

1. Go to PocketBase Admin UI (http://127.0.0.1:8090/_/)
2. Create a new collection called `users`
3. Add the fields as specified above
4. Configure the API rules as specified
5. Save the collection

### Initial Admin User

Create the first admin user via PocketBase Admin UI:
1. Go to the `users` collection
2. Click "New record"
3. Enter:
   - email: `admin@moka-crm.com`
   - name: `Admin`
   - password: (choose a strong password)
   - role: `admin`
4. Save

This first admin user will be created with full privileges.
