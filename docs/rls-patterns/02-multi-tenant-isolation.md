# Multi-Tenant RLS
## Overview
Multi-tenant Row-Level Security (RLS) in Supabase is a pattern used to restrict access to rows in a database based on the organization or team that the rows belong to, rather than just a single user. This is particularly useful in Software-as-a-Service (SaaS) applications where multiple organizations or teams share the same database. In this pattern, each row in the database is associated with a `tenant_id` that identifies the organization or team that the row belongs to.

## When to Use
This pattern is useful when you need to implement row-level security in a multi-tenant database, where each tenant has its own set of users and data. It's commonly used in SaaS applications, such as project management tools, customer relationship management (CRM) systems, and enterprise resource planning (ERP) systems.

## SQL Example
To implement multi-tenant RLS in Supabase, you need to create a policy that checks the `tenant_id` of each row against the `tenant_id` of the current user. Here's an example of how you can create a table with a `tenant_id` column and a policy that restricts access to rows based on the `tenant_id`:
```sql
-- Create a table with a tenant_id column
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  tenant_id UUID NOT NULL
);

-- Create a table to store tenant membership
CREATE TABLE tenant_members (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL
);

-- Create a policy that restricts access to rows based on the tenant_id
CREATE POLICY projects_select_policy
ON projects
FOR SELECT
TO public
USING (tenant_id = current_setting('request.tenant_id')::UUID);

CREATE POLICY projects_insert_policy
ON projects
FOR INSERT
TO public
WITH CHECK (tenant_id = current_setting('request.tenant_id')::UUID);

CREATE POLICY projects_update_policy
ON projects
FOR UPDATE
TO public
USING (tenant_id = current_setting('request.tenant_id')::UUID)
WITH CHECK (tenant_id = current_setting('request.tenant_id')::UUID);

CREATE POLICY projects_delete_policy
ON projects
FOR DELETE
TO public
USING (tenant_id = current_setting('request.tenant_id')::UUID);
```
In this example, the `projects` table has a `tenant_id` column that identifies the organization or team that each project belongs to. The `tenant_members` table stores the membership of each user in each tenant. The policies `projects_select_policy`, `projects_insert_policy`, `projects_update_policy`, and `projects_delete_policy` restrict access to rows in the `projects` table based on the `tenant_id` of the current user.

## Variations
There are several variations of this pattern that you can use depending on your specific use case:

* **Single-tenant database**: If you have a single-tenant database, you can simplify the policy by removing the `tenant_id` check and using a simple `TRUE` condition.
* **Multi-tenant database with a single user**: If you have a multi-tenant database with a single user, you can simplify the policy by removing the `tenant_id` check and using a simple `TRUE` condition.
* **Hierarchical tenants**: If you have a hierarchical tenant structure, you can create a recursive policy that checks the `tenant_id` of each row against the `tenant_id` of the current user and their ancestors.

## Edge Cases and Common Mistakes
Here are some edge cases and common mistakes to watch out for when implementing multi-tenant RLS in Supabase:

* **Null tenant_id**: Make sure to handle the case where the `tenant_id` is null. You can do this by adding a `COALESCE` function to the policy condition.
* **Invalid tenant_id**: Make sure to handle the case where the `tenant_id` is invalid. You can do this by adding a `CHECK` constraint to the `tenant_id` column.
* **Tenant membership**: Make sure to update the `tenant_members` table whenever a user's membership changes.
* **Policy ordering**: Make sure to order the policies correctly. The `USING` clause should be evaluated before the `WITH CHECK` clause.
* **Current setting**: Make sure to set the `request.tenant_id` current setting correctly. You can do this by using a middleware function that sets the current setting based on the request headers or query parameters.

Here's an example of how you can set the `request.tenant_id` current setting using a middleware function:
```sql
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('request.tenant_id', current_setting('request.headers.x-tenant-id'), TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenant_id_trigger
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION set_tenant_id();
```
In this example, the `set_tenant_id` function sets the `request.tenant_id` current setting based on the `x-tenant-id` header in the request. The `set_tenant_id_trigger` trigger calls the `set_tenant_id` function before each insert or update operation on the `projects` table.