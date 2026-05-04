# Admin Bypass RLS Pattern
## Overview
The Admin Bypass RLS (Row-Level Security) pattern in Supabase allows admin users to access all rows in a table, regardless of ownership. This is achieved by using a combination of role-based detection and custom claims in JWT metadata. The pattern involves creating a separate table to store user profiles, which includes a role column to determine whether a user is an admin or not.

## When to Use
This pattern is useful when you need to implement a role-based access control system, where admin users have elevated privileges to access all data, while regular users can only access their own data. This is common in applications where data ownership is important, such as project management tools, customer relationship management systems, or content management systems.

## SQL Example
To implement the Admin Bypass RLS pattern in Supabase, you need to create a `profiles` table to store user information, including their role. Here's an example SQL code block:
```sql
-- Create a profiles table to store user information
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user'))
);

-- Create a table with RLS enabled
CREATE TABLE data (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL
);

-- Enable RLS on the data table
ALTER TABLE data ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow admins to access all rows
CREATE POLICY admin_bypass ON data FOR SELECT, INSERT, UPDATE, DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
  ));

-- Create a policy to allow users to access their own rows
CREATE POLICY user_ownership ON data FOR SELECT, INSERT, UPDATE, DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```
In this example, the `profiles` table stores user information, including their role. The `data` table has RLS enabled, and two policies are created: `admin_bypass` and `user_ownership`. The `admin_bypass` policy allows admins to access all rows, while the `user_ownership` policy allows users to access their own rows.

## Variations
There are several variations of this pattern, including:

* Using custom claims in JWT metadata: Instead of storing user roles in a separate table, you can store them as custom claims in the JWT metadata. This can be done using the `auth.jwt()` function in Supabase.
* Using a separate table for roles: Instead of storing roles in the `profiles` table, you can create a separate `roles` table to store role information.
* Using a hierarchical role system: You can create a hierarchical role system, where admins have access to all data, managers have access to their team's data, and users have access to their own data.

## Edge Cases and Common Mistakes
Some common edge cases and mistakes to watch out for when implementing the Admin Bypass RLS pattern include:

* Forgetting to enable RLS on the table: Make sure to enable RLS on the table using the `ALTER TABLE` command.
* Incorrectly configuring the policies: Make sure to configure the policies correctly, including the `USING` clause and the `TO` clause.
* Not handling unauthenticated users: Make sure to handle unauthenticated users correctly, either by denying them access or redirecting them to a login page.
* Not testing the policies: Make sure to test the policies thoroughly to ensure they are working as expected.

Here's an example of how to test the policies:
```sql
-- Test the admin_bypass policy
SET ROLE authenticated;
SET jwt.claims = '{"role": "admin"}';
SELECT * FROM data;

-- Test the user_ownership policy
SET ROLE authenticated;
SET jwt.claims = '{"role": "user"}';
SELECT * FROM data WHERE user_id = auth.uid();
```
By following this pattern and avoiding common mistakes, you can implement a robust and secure role-based access control system in Supabase.