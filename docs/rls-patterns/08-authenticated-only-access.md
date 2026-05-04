# Authenticated-only Access RLS Pattern
## Overview
The Authenticated-only Access Row-Level Security (RLS) pattern in Supabase is a security mechanism that restricts access to specific tables, allowing only authenticated users to view or modify data. This pattern is particularly useful for tables that do not have an ownership column, where any logged-in user should be able to access all rows. In this document, we will delve into the details of implementing this pattern, its appropriate use cases, and essential security considerations.

## When to Use
This RLS pattern is suitable for scenarios where:
- You have tables that contain data that should be accessible to all authenticated users, but not to the general public.
- There is no concept of ownership or row-level permissions, and all logged-in users have the same level of access.
- You want to ensure that sensitive data is protected from unauthorized access, while still allowing legitimate users to access the information they need.

Examples of such tables might include:
- A table storing company-wide announcements or news.
- A table containing a list of available resources or tools that all employees can access.

## SQL Example
To implement the Authenticated-only Access RLS pattern in Supabase, you can use the following SQL policy:
```sql
-- Create a policy that allows select, insert, update, and delete
-- for any authenticated user on the 'company_announcements' table
CREATE POLICY company_announcements_authenticated_only
ON company_announcements
FOR SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (true);
```
In this example, the `USING (true)` clause means that the policy will always evaluate to true for authenticated users, granting them access to all rows in the `company_announcements` table.

## Variations
You can modify the policy to fit specific use cases. For instance, if you want to allow only read-only access to the table for authenticated users, you can change the `FOR` clause to only include `SELECT`:
```sql
CREATE POLICY company_announcements_read_only
ON company_announcements
FOR SELECT
TO authenticated
USING (true);
```
Alternatively, if you need to restrict access to specific columns within the table, you can use the `CHECK` clause to define a policy that only allows access to certain columns:
```sql
CREATE POLICY company_announcements_column_restrict
ON company_announcements
FOR SELECT
TO authenticated
USING (true)
WITH CHECK (column_name IS NOT NULL);
```
Replace `column_name` with the actual name of the column you want to restrict access to.

## Edge Cases and Common Mistakes
- **Unintended public access**: Ensure that you do not accidentally grant public access to the table by omitting the `TO authenticated` clause or using `USING (true)` without proper authentication checks.
- **Insufficient policy granularity**: Failing to define policies for all necessary operations (e.g., `SELECT`, `INSERT`, `UPDATE`, `DELETE`) can lead to unintended access levels.
- **Policy misordering**: Supabase evaluates policies in the order they are defined. If you have multiple policies for the same table, ensure that the most restrictive policies are defined last to avoid overriding less restrictive ones.
- **Lack of auditing and monitoring**: Implementing RLS policies without proper auditing and monitoring can make it difficult to detect and respond to potential security incidents.

By following the guidelines outlined in this document and being mindful of the potential edge cases and common mistakes, you can effectively implement the Authenticated-only Access RLS pattern in Supabase to secure your tables and protect sensitive data.