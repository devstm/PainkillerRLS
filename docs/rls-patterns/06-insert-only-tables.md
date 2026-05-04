# Insert-only RLS pattern
## Overview
The Insert-only RLS (Row-Level Security) pattern in Supabase is a design approach that restricts users to only insert data into specific tables, while preventing them from reading or modifying their own rows. This pattern is particularly useful for tables that store sensitive information, such as audit logs or event tracking data, where users should not be able to access or alter their own records.

## When to Use
This pattern is suitable for use cases where:

* Users need to generate records, but should not be able to view or modify them.
* Data integrity and immutability are crucial, such as in auditing or logging scenarios.
* Compliance with regulatory requirements, like GDPR or HIPAA, demands strict access controls.

Examples of tables that may benefit from the Insert-only RLS pattern include:

* Audit logs
* Event tracking data
* User activity records
* System logs

## SQL Example
To implement the Insert-only RLS pattern in Supabase, you can use the following SQL code:
```sql
-- Create a table for audit logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create a policy that allows users to insert data, but not read or modify
CREATE POLICY audit_logs_insert_only ON audit_logs FOR INSERT TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (TRUE);

-- Create a policy that denies all read and update operations
CREATE POLICY audit_logs_deny_read_update ON audit_logs FOR SELECT, UPDATE, DELETE TO authenticated
  USING (FALSE);
```
In this example, the `audit_logs` table has a column `user_id` that stores the ID of the user who generated the log entry. The `audit_logs_insert_only` policy allows authenticated users to insert data into the table, but only if the `user_id` matches their own ID. The `audit_logs_deny_read_update` policy denies all read and update operations, ensuring that users cannot access or modify their own log entries.

## Variations
There are several variations of the Insert-only RLS pattern that you can use, depending on your specific requirements:

* **Insert-only with custom conditions**: You can modify the `USING` clause of the insert policy to include custom conditions, such as checking the user's role or permissions.
* **Insert-only with multiple tables**: You can apply the Insert-only RLS pattern to multiple tables, using a single policy or separate policies for each table.
* **Insert-only with row-level permissions**: You can use row-level permissions to grant users access to specific rows in the table, while still preventing them from reading or modifying their own rows.

## Edge Cases and Common Mistakes
When implementing the Insert-only RLS pattern, be aware of the following edge cases and common mistakes:

* **Inconsistent policy definitions**: Ensure that your policies are consistently defined and applied to all relevant tables.
* **Insufficient testing**: Thoroughly test your policies to ensure that they behave as expected, especially in edge cases.
* **Overly permissive policies**: Avoid creating policies that are too permissive, as this can compromise the security and integrity of your data.
* **Failure to update policies**: Remember to update your policies when your schema or requirements change, to ensure that your access controls remain effective.

By following the Insert-only RLS pattern and being mindful of these edge cases and common mistakes, you can effectively restrict user access to sensitive data in your Supabase database, while still allowing them to generate records as needed.