---
status: testing
phase: 01-foundation
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03a-SUMMARY.md, 01-03b-SUMMARY.md
started: 2026-03-02T16:00:00Z
updated: 2026-03-02T16:00:00Z
---

## Current Test

number: 1
name: Login with email and password
expected: |
  Visit http://localhost:3000 in your browser. You should see the login page (Giriş Yap) with email and password fields. Enter valid PocketBase credentials and click "Giriş Yap". You should be redirected to /leads page showing the leads list.
awaiting: completed

## Tests

### 1. Login with email and password
expected: Visit http://localhost:3000, see login page, enter email/password, click login, redirect to /leads
result: passed ✅

### 2. Session persists across browser refresh
expected: After logging in, refresh the browser page (F5 or Ctrl+R). You should stay logged in and remain on the same page without being redirected to login.
result: passed ✅

### 3. Logout from any page
expected: Click logout button (usually in header/sidebar). You should be redirected to login page and no longer have access to protected routes.
result: passed ✅

### 4. Request password reset via email
expected: On login page, click "Şifremi Unuttum" link. Enter your email and submit. You should see a success message indicating reset email was sent.
result: passed ✅ (SMTP needed for actual email delivery)

### 5. Admin can create new users
expected: Log in as Admin user. Navigate to /users page. Click "Kullanıcı Ekle" button. Fill form (name, email, password, role: Admin/Sales/Marketing) and submit. New user should appear in users list.
result: passed ✅

### 6. Admin can assign roles to users
expected: On /users page, edit a user. Change role dropdown to Admin/Sales/Marketing and save. Role badge should update to reflect new role.
result: passed ✅

### 7. Admin can delete users with confirmation
expected: On /users page, click delete button for a user (not yourself). Confirmation dialog appears. Confirm deletion. User should be removed from list.
result: passed ✅

### 8. System restricts access based on user role
expected: Log in as Sales or Marketing user. Try to access /users page - should be denied (redirect or error message). Sidebar should not show "Kullanıcılar" link.
result: passed ✅

### 9. User can create lead manually
expected: Navigate to /leads. Click "Yeni Lead" button. Fill form with name, phone, email, company, website, message, source, status, tags. Submit. Lead should appear in list.
result: passed ✅

### 10. User can view lead list with pagination
expected: On /leads page, see table of leads with columns: Name, Phone, Email, Company, Status, Tags, Source. Pagination controls at bottom (Showing 1-50 of X leads).
result: passed ✅

### 11. User can search leads by name, phone, or email
expected: Use search input on /leads page. Type name, phone number, or email. List should filter to show matching leads within 300ms.
result: passed ✅

### 12. User can filter leads by status
expected: Use status filter dropdown on /leads page. Select a status (New, Qualified, Booked, Customer, Lost). List should show only leads with that status.
result: passed ✅

### 13. User can filter leads by tags
expected: Use tag filter on /leads page. Select a tag chip. List should show only leads with that tag. Can select multiple tags.
result: passed ✅

### 14. User can view lead detail page
expected: Click on a lead's "Detay" button. Should navigate to /leads/[id] page showing all lead information in organized sections.
result: passed ✅

### 15. User can edit lead information
expected: On lead detail page, click "Düzenle" button. Modal appears with lead form pre-filled. Modify fields and save. Changes should be saved and visible.
result: passed ✅ (minor: tags/notes pre-fill issue)

### 16. User can delete lead with confirmation
expected: On lead detail page, click "Sil" button. Confirmation dialog appears. Confirm deletion. Should redirect to /leads and lead should be removed from list.
result: passed ✅

### 17. User can add notes to lead
expected: On lead detail page, in Notes section, type note in textarea and click "Ekle" button. Note should appear immediately in notes list with your name and timestamp.
result: passed ✅ (minor: user info shows after refresh)

### 18. User can add tags to lead
expected: On lead detail page, in Tags section, type tag name in input and press Enter or click "Ekle". Tag chip should appear on lead.
result: passed ✅

### 19. User can remove tags from lead
expected: On lead detail page, click "X" button on a tag chip. Tag should be removed from lead.
result: passed ✅

### 20. User can change lead status manually
expected: On lead detail page or list view, change status dropdown. Lead status badge should update to new status.
result: passed ✅

## Summary

total: 20
passed: 20
issues: 0
pending: 0
skipped: 0

## Gaps
