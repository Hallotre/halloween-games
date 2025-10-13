# Production SQL

Apply order (recommended):

1. supabase-tracking-schema.sql
2. create-secure-analytics-tables.sql
3. secure-views.sql (or secure-views-with-invoker.sql)
4. secure-analytics-views.sql
5. secure-halloween-dashboard-views.sql
6. secure-additional-views.sql
7. enhanced-analytics-views.sql
8. enhanced-event-summary.sql
9. create-comprehensive-analytics.sql (optional aggregation helpers)
10. supabase-rls-performance-fix.sql (optional tuning)

Notes:
- Run with the Supabase SQL editor using a privileged role.
- Keep client roles restricted; only service_role should SELECT views.
- If you use invoker variants, ensure the invoker function is created and granted.
