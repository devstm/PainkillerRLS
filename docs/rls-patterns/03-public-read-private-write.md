# Public Read with Private Write RLS Pattern
## Overview
The Public Read with Private Write Row-Level Security (RLS) pattern is a common access control mechanism used in Supabase to restrict write operations to the owners of a record while allowing anyone to read the data. This pattern is particularly useful for tables like blog posts or articles where anyone can view the content, but only the author or owner should be able to modify or delete it.

## When to Use
This pattern is suitable for use cases where data needs to be publicly accessible for reading, but modifications should be restricted to the owner or a specific group of users. Typical examples include:
- Blog posts or articles
- User profiles
- Product reviews
- Comments or forums

## SQL Example
To implement the Public Read with Private Write RLS pattern in Supabase, you need to create policies for each of the four main operations: `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Here's an example using a `blog_posts` table with an `id` column, a `content` column, and an `owner_id` column referencing the `id` in the `users` table:

```sql
-- Create the users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE
);

-- Create the blog_posts table
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id)
);

-- Enable RLS on the blog_posts table
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy for public read
CREATE POLICY blog_posts_select_policy
ON blog_posts
FOR SELECT
TO public
USING (TRUE);

-- Policy for private write (insert, update, delete) restricted to owners
CREATE POLICY blog_posts_insert_policy
ON blog_posts
FOR INSERT
TO public
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY blog_posts_update_policy
ON blog_posts
FOR UPDATE
TO public
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY blog_posts_delete_policy
ON blog_posts
FOR DELETE
TO public
USING (auth.uid() = owner_id);
```

In this example, `auth.uid()` is used to get the ID of the currently authenticated user. The `USING` clause in the `UPDATE` policy ensures that only the owner can update a record, and the `WITH CHECK` clause further restricts the update to only allow changes where the `owner_id` matches the current user's ID. The `INSERT` and `DELETE` policies similarly restrict these operations to the owner.

## Variations
There are several variations of this pattern, including:
- **Admin Override**: Adding an additional policy or condition that allows administrators or specific roles to perform any operation on any record, regardless of ownership.
- **Group Ownership**: Extending the ownership concept to groups, where members of a group can perform write operations on records associated with that group.
- **Time-Based Access**: Implementing time-based restrictions, such as allowing owners to edit a post only within a certain time frame after its creation.

## Edge Cases and Common Mistakes
- **Forgetting to Enable RLS**: RLS must be explicitly enabled on each table. Forgetting to do so means that policies will not be enforced.
- **Incorrect Use of `USING` and `WITH CHECK`**: In Supabase, `USING` is for filtering which rows are visible, and `WITH CHECK` is for controlling the data that can be inserted or updated. Mixing these up can lead to unexpected access control behavior.
- **Not Handling Null or Missing Values**: Policies should account for null or missing values in columns used for access control, such as `owner_id`, to prevent unintended access.
- **Overly Permissive Policies**: Starting with very permissive policies and then trying to restrict them can lead to security vulnerabilities. It's better to start with restrictive policies and then loosen them as needed.