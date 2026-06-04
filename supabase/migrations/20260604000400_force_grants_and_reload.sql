-- Force explicit GRANTS to authenticated role for all operational tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
