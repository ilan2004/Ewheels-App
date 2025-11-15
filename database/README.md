# EvWheels Database Setup Instructions

## 📋 Prerequisites

1. **Supabase Project**: Your Supabase project is already configured (credentials in `.env.local`)
2. **Admin Access**: You need admin access to your Supabase project dashboard

## 🚀 Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sddolthuxysdqdrmvsxh`
3. Navigate to **SQL Editor** from the left sidebar
4. Click **"New Query"**

### Step 2: Run Schema Setup

1. **Copy** the contents of `setup-schema.sql`
2. **Paste** into the SQL Editor
3. **Click "Run"** to execute the script
4. **Verify** you see success message: `"EvWheels database schema setup completed successfully!"`

### Step 3: Create Your User Account

1. Go to **Authentication > Users** in Supabase Dashboard
2. Click **"Add User"** 
3. Create an admin user with email like: `admin@evwheels.com`
4. Set a password (remember this!)
5. **Note the User ID** from the users table for next step

### Step 4: Run Sample Data Script (Optional)

1. **Copy** the contents of `sample-data.sql`
2. **Paste** into a new SQL query
3. **Important**: Replace `auth.uid()` with your actual user ID from Step 3
   - Find and replace all instances of `auth.uid()` with your user ID like `'12345678-1234-1234-1234-123456789abc'`
4. **Click "Run"** to execute
5. **Verify** you see: `"Sample data inserted successfully!"`

### Step 5: Test the Setup

1. **Restart** your Expo development server:
   ```bash
   npx expo start --clear
   ```

2. **Login** with the user account you created:
   - Email: `admin@evwheels.com` (or whatever you created)
   - Password: (what you set)

3. **Check Dashboard**: You should see real data from your database!

## 🔧 Database Structure Overview

The setup creates these main tables:

- **`locations`**: Service center locations
- **`profiles`**: User profile information
- **`app_roles`**: User role assignments
- **`customers`**: Customer information
- **`vehicles`**: Vehicle details
- **`service_tickets`**: Main job cards/tickets
- **`battery_records`**: Battery-specific tracking
- **`ticket_attachments`**: File attachments
- **`notifications`**: In-app notifications

## 🛡️ Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Basic policies** created for authentication
- **Indexes** for optimal query performance
- **Triggers** for automatic `updated_at` timestamps

## 🚨 Troubleshooting

### Issue: "Table does not exist" errors
**Solution**: Make sure you ran the `setup-schema.sql` script first

### Issue: "Permission denied" errors  
**Solution**: Check your RLS policies or temporarily disable RLS for testing:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Issue: No data showing in app
**Solution**: 
1. Check you replaced `auth.uid()` with actual user ID in sample-data.sql
2. Verify you're logged in with the correct user account
3. Check browser/app console for any error messages

### Issue: Mock data still showing
**Solution**: 
1. Confirm `.env.local` has `USE_MOCK_API=false`
2. Restart your development server with `--clear` flag
3. Clear app cache/data

## 📞 Need Help?

If you encounter issues:

1. **Check Supabase Logs**: Go to Logs section in Supabase dashboard
2. **Check Console**: Look for errors in browser/app developer console  
3. **Verify Tables**: Use SQL editor to run `SELECT * FROM service_tickets LIMIT 5;`

## 🎯 Next Steps

After successful setup:

1. ✅ **Test Login**: Use your admin account
2. ✅ **Check Dashboard**: Verify KPIs load from real data
3. ✅ **Test Navigation**: Click KPI cards to filter job cards
4. ✅ **Create New Tickets**: Test the create ticket functionality
5. ✅ **Test Filtering**: Try different filters in job cards screen

Your app is now connected to real Supabase data! 🎉
