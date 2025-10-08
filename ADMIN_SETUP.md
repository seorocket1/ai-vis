# Admin Access Setup

## Admin Account

The account **nigamaakash101@gmail.com** has been configured as the admin account with exclusive access to admin features.

## How It Works

1. **Hardcoded Admin Email**: The email `nigamaakash101@gmail.com` is hardcoded in the `AuthContext` as the only admin user.

2. **Automatic Admin Status**: When this email signs in:
   - The `isAdmin` flag is automatically set to `true`
   - The user's profile in the database is automatically updated with `is_admin = true`

3. **Admin-Only Features**:
   - **Admin Menu Item**: Only visible to the admin account in the sidebar
   - **Admin Badge**: Shows an "Admin" badge next to the account in the sidebar
   - **Admin Page Access**: Protected route that shows "Access Denied" to non-admin users

## Admin Features

The admin account has access to:

- **Admin Dashboard**: View all users and system statistics
- **User Management**: View user details, execution counts, and activity
- **System Stats**: Total users, executions, prompts, and averages
- **User Status Control**: Ability to manage user onboarding status

## Security

- **Email-Based Protection**: Only `nigamaakash101@gmail.com` can access admin features
- **Client-Side Check**: Immediate blocking in the UI for non-admin users
- **Database RLS Policies**: Database-level security ensures admin queries only work for admin users
- **No Other Admin Creation**: No interface or mechanism exists to create additional admins

## First-Time Setup

When `nigamaakash101@gmail.com` signs up for the first time:

1. Create an account using the sign-up flow
2. Complete the onboarding process
3. The system will automatically detect the admin email
4. Admin features will be immediately available
5. The "Admin" menu item will appear in the sidebar

## Accessing Admin Features

1. Sign in with `nigamaakash101@gmail.com`
2. Look for the "Admin" badge in the sidebar profile section
3. Click the "Admin" menu item to access the admin dashboard
4. View all users, statistics, and manage the system

## Important Notes

- **Single Admin Only**: Only this one email has admin access
- **No Admin Promotion**: Other users cannot be promoted to admin through the UI
- **Database Security**: RLS policies ensure data security at the database level
- **Automatic Updates**: The database automatically updates when the admin user signs in
