# Profiles Table RLS Pattern
## Overview
The Profiles table RLS (Row-Level Security) pattern in Supabase is a common approach to manage access control for user profiles. This pattern relies on the `id` column in the `profiles` table directly referencing the `id` column in the `auth.users` table. By using this pattern, you can effectively control who can view or edit a user's profile.

## When to Use
This pattern is suitable when you want to restrict access to user profiles, allowing only the owner of the profile (or administrators) to view or edit their own profile. Additionally, this pattern can be used when you want to make certain profiles publicly visible, while still maintaining control over who can edit them.

## SQL Example
To implement this pattern, you can create a policy on the `profiles` table that checks if the current user's ID matches the `id` column in the table. Here's an example SQL code block:
```sql
-- Create a policy on the profiles table
CREATE POLICY profiles_select_policy
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy on the profiles table for insert, update, and delete
CREATE POLICY profiles_modify_policy
ON profiles
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = id);
```
In this example, the `profiles_select_policy` allows authenticated users to select rows from the `profiles` table where the `id` column matches their user ID. The `profiles_modify_policy` allows authenticated users to insert, update, or delete rows from the `profiles` table where the `id` column matches their user ID.

## Variations
To handle public profile visibility, you can create an additional policy that allows anyone to select rows from the `profiles` table where a specific column (e.g., `is_public`) is set to `true`. Here's an example:
```sql
-- Create a policy on the profiles table for public visibility
CREATE POLICY profiles_public_policy
ON profiles
FOR SELECT
TO public
USING (is_public = true);
```
This policy allows anyone (including unauthenticated users) to select rows from the `profiles` table where the `is_public` column is set to `true`.

## Edge Cases and Common Mistakes
One common mistake is to use `auth.uid() = profiles.user_id` instead of `auth.uid() = id`. This is incorrect because the `user_id` column may not exist in the `profiles` table, and even if it does, it may not be the correct column to reference.

Another edge case is when you want to allow administrators to view or edit all profiles. To handle this, you can create an additional policy that checks if the current user has a specific role (e.g., `admin`) and allows them to perform the desired actions. Here's an example:
```sql
-- Create a policy on the profiles table for administrators
CREATE POLICY profiles_admin_policy
ON profiles
FOR SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (auth.role() = 'admin');
```
This policy allows users with the `admin` role to perform any action on the `profiles` table, regardless of the `id` column.