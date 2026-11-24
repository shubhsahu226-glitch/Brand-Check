-- Enable Row Level Security (RLS) on all tables with NO public policies
-- This ensures the Supabase public anon key cannot read or mutate any data.
-- Backend queries connect via direct/pooler credentials which bypass RLS.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BrandDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
