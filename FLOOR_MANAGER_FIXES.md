# Floor Manager Technician Creation Fixes

## Issue 1: Foreign Key Relationship Missing

**Error:** `Could not find a relationship between 'profiles' and 'app_roles' in the schema cache`

**Fix:** Run this SQL in Supabase:

```sql
-- Add foreign key constraint
ALTER TABLE app_roles 
ADD CONSTRAINT app_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

## Issue 2: Network Request Failed

**Error:** `[TypeError: Network request failed]`

**Problem:** The mobile app doesn't know your API URL.

**Fix:** Create environment file:

### Create `.env` file:
```bash
# In EvWheelsApp folder, create .env file:
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000

# Replace YOUR_LOCAL_IP with your actual IP address
# Example: EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

### Find your IP address:
**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (usually 192.168.x.x)

**Alternative Quick Fix:**
If you're running the Next.js server locally, update the component:

```typescript
// In components/floor-manager/create-technician-form.tsx line 85
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000'; // Replace with your actual IP
```

## Issue 3: Test the Connection

After fixes, test with:

1. **Check foreign key was added:**
```sql
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'app_roles' AND constraint_type = 'FOREIGN KEY';
```

2. **Test API endpoint directly:**
```bash
curl -X GET "http://YOUR_IP:3000/api/floor-manager/technicians" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Complete Fix Checklist:

- [ ] Run foreign key SQL in Supabase
- [ ] Create `.env` file with correct API URL
- [ ] Restart Expo development server
- [ ] Test technician creation in mobile app

## Quick Test Steps:

1. Open Supabase SQL Editor
2. Run the foreign key SQL above
3. In mobile app folder, create `.env` with your API URL
4. Restart `npm start`
5. Try creating a technician in the app
