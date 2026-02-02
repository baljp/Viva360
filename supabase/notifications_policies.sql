-- Enable Realtime for Notifications table
alter publication supabase_realtime add table notifications;

-- Enable Row Level Security
alter table "notifications" enable row level security;

-- Policy: Select
-- Users can only see notifications where user_id matches their UUID
create policy "Users can see their own notifications" on "notifications" for
select to authenticated using (
        (
            select auth.uid ()
        ) = user_id
    );

-- Policy: Update (Mark as Read)
-- Users can update `read` status of their own notifications
create policy "Users can update their own notifications" on "notifications" for
update to authenticated using (
    (
        select auth.uid ()
    ) = user_id
)
with
    check (
        (
            select auth.uid ()
        ) = user_id
    );

-- Policy: Insert
-- Only service role usually inserts, but if we want users to "send" notes, we'd need this.
-- For now, we assume Backend/Service Role handles inserts.