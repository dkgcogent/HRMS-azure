# Quick Start Guide: Customer & Project Dropdowns

## Step 1: Run the SQL Script

Open your MySQL client (MySQL Workbench, phpMyAdmin, or command line) and execute the SQL script:

```bash
# Location of the SQL script
d:\DKG HRMS\hrms-main\hrms-main\add_customer_project_masters.sql
```

This will:
- Create the `customers` table
- Create the `projects` table  
- Add `customer_id` and `project_id` columns to the `employees` table
- Insert 3 sample customers and 3 sample projects

## Step 2: Restart the Servers

The backend and frontend servers are already running. They should automatically pick up the changes, but if you encounter any issues, restart them:

### Backend (already running in terminal)
- Press `Ctrl+C` to stop
- Run: `npm run dev`

### Frontend (already running in terminal)
- Press `Ctrl+C` to stop
- Run: `npm start`

## Step 3: Test the Feature

1. Open your browser and navigate to the HRMS application
2. Go to **Add New Employee**
3. Click on the **Official Information** tab
4. You should now see two new dropdown fields:
   - **Customer** (after Shift field)
   - **Project** (after Customer field)
5. Both dropdowns should show the sample data:
   - Customers: Customer A, Customer B, Customer C
   - Projects: Project Alpha, Project Beta, Project Gamma

## Step 4: Create a Test Employee

1. Fill in the required fields in **Personal Information**
2. Go to **Official Information**
3. Fill in the required fields (Manpower Type, Department, Designation, etc.)
4. **Optionally** select a Customer and/or Project
5. Click **Save Employee**
6. Verify the employee was created successfully

## Step 5: Add More Customers and Projects (Optional)

You can add more customers and projects through the Master Setup menu:

1. Go to **Masters** in the sidebar
2. Click on **Customers** (you may need to add this menu item)
3. Add new customers
4. Similarly, add new projects

## Troubleshooting

### Issue: Dropdowns are empty
**Solution**: Make sure you ran the SQL script and it executed successfully. Check the database to verify the `customers` and `projects` tables exist and have data.

### Issue: Error when saving employee
**Solution**: Check the browser console for errors. Make sure the backend server is running and the API endpoints are accessible.

### Issue: Fields don't appear
**Solution**: Clear your browser cache and refresh the page. Make sure the frontend server restarted successfully.

### Issue: TypeScript errors in the console
**Solution**: Restart the frontend development server. TypeScript should recompile the changes.

## What's Next?

- Add more customers and projects through the UI (you'll need to create the master management pages)
- The Customer and Project fields are now available when editing existing employees
- You can filter employees by customer or project (requires additional implementation)
- You can generate reports based on customer or project assignments (requires additional implementation)

## Support

If you encounter any issues, check:
1. The `IMPLEMENTATION_SUMMARY.md` file for detailed implementation details
2. The browser console for JavaScript errors
3. The backend terminal for API errors
4. The database for data integrity issues
