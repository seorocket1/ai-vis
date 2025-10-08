# Admin Access & Subscription Management

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

---

## Admin Dashboard Features

### 1. System Statistics
View real-time metrics across the entire platform:
- **Total Users**: Count of free and pro users
- **Total Executions**: All AI query executions with per-user average
- **Active Prompts**: Number of prompts across all users
- **Queries Used**: Total queries consumed this month

### 2. User Management

#### View All Users
- Complete list of all registered users
- Display user email, brand name, and admin status
- Show registration date and last activity

#### Plan Management
Each user can be in one of two plans:

**Free Plan** (Default)
- 5 AI queries per month
- All analytics features
- 1 brand profile
- Email support

**Pro Plan** (Admin-Controlled)
- 500 AI queries per month
- All analytics features
- 5 brand profiles
- Priority support
- Auto-downgrades after 30 days

#### Admin Actions Per User

**Upgrade to Pro**
- Click "Upgrade to Pro" button
- User immediately gets Pro plan (500 queries/month)
- 30-day timer starts from upgrade date
- Auto-downgrade after 30 days unless renewed

**Downgrade to Free**
- Click "Downgrade to Free" button
- User immediately returns to Free plan (5 queries/month)
- Resets plan timer

**Reset Queries**
- Click "Reset Queries" button
- Sets user's monthly query count back to 0
- Resets the 30-day query counter
- Useful for giving users a fresh start

**View Prompts**
- Click "View" button to expand user details
- See all prompts created by the user
- View prompt status (Active/Inactive)
- Check execution count per prompt
- See prompt creation dates

### 3. Usage Tracking

**Query Usage Bars**
- Green: Under 80% usage (healthy)
- Yellow: 80-99% usage (warning)
- Red: 100% usage (limit reached)

**Plan Expiration**
- Pro users show "X days left" counter
- Automatic downgrade when 30 days elapse
- Admin can manually upgrade again

---

## Subscription System

### How Plans Work

**Default Behavior**
1. All new users start on **Free Plan** (5 queries/month)
2. Only admin can upgrade users to **Pro Plan**
3. Pro plan automatically downgrades after 30 days
4. Query limits reset every 30 days

**Query Enforcement**
- Users cannot trigger AI queries when limit is reached
- Error message displays remaining queries
- Suggests upgrading to Pro or waiting for reset
- Admin can reset queries manually at any time

**Query Tracking**
- Each AI query execution increments user's counter
- Atomic database operations prevent race conditions
- Usage displayed in user's sidebar and admin dashboard
- Real-time updates across the application

### Database Structure

**profiles table** includes:
```
- subscription_plan: 'free' | 'pro'
- plan_started_at: timestamp
- monthly_query_limit: 5 (free) or 500 (pro)
- queries_used_this_month: current usage counter
- last_query_reset_at: timestamp of last reset
```

### Automatic Maintenance

**Query Resets** (Every 30 Days)
- Runs automatically based on `last_query_reset_at`
- Resets `queries_used_this_month` to 0
- Updates `last_query_reset_at` timestamp

**Plan Downgrades** (Pro to Free after 30 Days)
- Checks `plan_started_at` timestamp
- Automatically downgrades Pro users after 30 days
- Can be manually upgraded again by admin

---

## Security

- **Email-Based Protection**: Only `nigamaakash101@gmail.com` can access admin features
- **Client-Side Check**: Immediate blocking in the UI for non-admin users
- **Database RLS Policies**: Database-level security ensures admin queries only work for admin users
- **No Other Admin Creation**: No interface or mechanism exists to create additional admins
- **Protected Plan Changes**: Regular users cannot modify their own plan or query limits

---

## First-Time Setup

When `nigamaakash101@gmail.com` signs up for the first time:

1. Create an account using the sign-up flow
2. Complete the onboarding process (set brand name)
3. The system will automatically detect the admin email
4. Admin features will be immediately available
5. The "Admin" menu item will appear in the sidebar
6. Admin badge will show next to account name

---

## Using Admin Features

### To Upgrade a User to Pro

1. Sign in with `nigamaakash101@gmail.com`
2. Click "Admin" in the sidebar
3. Find the user in the user table
4. Click "Upgrade to Pro" button
5. User immediately has 500 queries/month for 30 days

### To View a User's Prompts

1. Navigate to Admin dashboard
2. Find the user in the table
3. Click the "View" button (with eye icon)
4. See all prompts with details
5. Click "Hide" to collapse

### To Reset User Queries

1. Find the user in the admin table
2. Check their usage bar (red = limit reached)
3. Click "Reset Queries" button
4. User can immediately create new queries

### To Manually Downgrade

1. Find the Pro user
2. See "X days left" indicator
3. Click "Downgrade to Free" if needed before auto-downgrade
4. User returns to 5 queries/month

---

## Important Notes

- **Single Admin Only**: Only nigamaakash101@gmail.com has admin access
- **No Admin Promotion**: Other users cannot be promoted to admin through the UI
- **Database Security**: RLS policies ensure data security at the database level
- **Automatic Maintenance**: Plans and queries auto-reset based on timestamps
- **Real-Time Updates**: All changes reflect immediately in user's account
- **Non-Intrusive**: Users see their plan and limits in the sidebar
- **Flexible Management**: Admin has complete control over all user plans

---

## Troubleshooting

### Users Not Showing in Admin Dashboard

If you can't see users in the admin dashboard:
1. Verify you're signed in as `nigamaakash101@gmail.com`
2. Check the database migrations have been applied
3. Verify RLS policies allow admin to view all profiles
4. Check browser console for any errors

### Query Limits Not Enforcing

If users can exceed their limits:
1. Check the `checkQueryLimit` function is called before execution
2. Verify database has the query tracking columns
3. Ensure `incrementQueryUsage` is being called
4. Check for any database errors in console

### Pro Plan Not Auto-Downgrading

If Pro users aren't auto-downgrading after 30 days:
1. The system checks on each login/query
2. Run database maintenance function manually if needed
3. Admin can manually downgrade users anytime
