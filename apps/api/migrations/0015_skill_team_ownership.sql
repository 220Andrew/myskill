-- Add team_id column to skills for tenant isolation
-- Initially nullable to support safe migration
ALTER TABLE skills ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE RESTRICT;
CREATE INDEX skills_team_idx ON skills (team_id);

-- Create DEFAULT_TEAM for backward compatibility and legacy data
INSERT INTO teams (name, slug, created_at, updated_at)
VALUES ('Default Team', 'default-team', now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Get the default team ID for backfill (idempotent approach)
-- If this migration runs multiple times, subsequent runs will use the existing team.
-- The backfill below checks if team_id is NULL before assigning.

-- Backfill existing skills without a team to the DEFAULT_TEAM
-- This is safe: only updates NULL team_ids
UPDATE skills
SET team_id = (SELECT id FROM teams WHERE slug = 'default-team')
WHERE team_id IS NULL;

-- After backfill, make team_id NOT NULL
ALTER TABLE skills ALTER COLUMN team_id SET NOT NULL;
