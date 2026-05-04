# Basic Row Ownership
## Overview
Basic row ownership is a fundamental concept in Supabase Row-Level Security (RLS) that allows you to control access to specific rows in a table based on the user's identity. This pattern is useful when you want to restrict users to only see or modify their own data. In this pattern, a `user_id` column in a table is linked to the `auth.users` table, which stores information about the authenticated users.

## When to Use
Use basic row ownership when:
- You have a multi-tenant application where each user should only see their own data.
- You want to implement a simple access control system where users can only modify their own rows.
- You need to restrict access to sensitive data based on user identity.

This pattern is particularly useful in applications where users are creating and managing their own data, such as to-do lists, personal notes, or profiles.

## SQL Example
To implement basic row ownership in Supabase, you need to create a policy that links the `user_id` column in your table to the `auth.users` table. Here's an example using the `posts` table:
```sql
-- Create a table with a user_id column
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL
);

-- Create a policy for SELECT
CREATE POLICY posts_select_policy
ON posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a policy for INSERT
CREATE POLICY posts_insert_policy
ON posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create a policy for UPDATE
CREATE POLICY posts_update_policy
ON posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a policy for DELETE
CREATE POLICY posts_delete_policy
ON posts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```
In this example, the `posts` table has a `user_id` column that links each post to the user who created it. The policies ensure that users can only see, insert, update, or delete posts that belong to them.

## Variations
You can modify the basic row ownership pattern to fit your specific use case. For example:
- You can add additional conditions to the policy to restrict access based on other factors, such as the user's role or the post's status.
- You can use a different column to link the table to the `auth.users` table, such as an `owner_id` or `creator_id` column.
- You can create separate policies for different tables, or create a single policy that applies to multiple tables.

Here's an example of a modified policy that restricts access based on the user's role:
```sql
CREATE POLICY posts_select_policy
ON posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND auth.role() = 'admin');
```
This policy only allows users with the `admin` role to see posts that belong to them.

## Edge Cases and Common Mistakes
Here are some common mistakes to watch out for when implementing basic row ownership:
- Forgetting to create a policy for each type of operation (SELECT, INSERT, UPDATE, DELETE).
- Not linking the `user_id` column to the `auth.users` table correctly.
- Not using the correct syntax for the policy, such as using `USING` instead of `WITH CHECK`.
- Not testing the policy thoroughly to ensure it's working as expected.

Some edge cases to consider:
- What happens when a user is deleted from the `auth.users` table? Will their posts still be accessible?
- What happens when a post is updated to change the `user_id` column? Will the policy still apply?
- How will you handle cases where a user needs to access posts that belong to someone else, such as in a shared workspace or collaborative project?

To avoid these mistakes and edge cases, make sure to:
- Carefully review the Supabase documentation and examples to ensure you're using the correct syntax and approach.
- Test your policies thoroughly to ensure they're working as expected.
- Consider implementing additional logic or validation to handle edge cases and unexpected scenarios.