ALTER TABLE skill_versions
  ADD COLUMN approved_artifact_sha256 text;

UPDATE skill_versions
SET approved_artifact_sha256 = skill_artifacts.sha256
FROM skill_artifacts
WHERE skill_artifacts.skill_version_id = skill_versions.id
  AND skill_versions.review_status = 'approved'
  AND skill_versions.published_at IS NULL
  AND skill_versions.approved_artifact_sha256 IS NULL;

ALTER TABLE skill_versions
  ADD CONSTRAINT skill_versions_approved_artifact_sha256_format
  CHECK (approved_artifact_sha256 IS NULL OR approved_artifact_sha256 ~ '^[a-f0-9]{64}$');

CREATE INDEX IF NOT EXISTS skill_artifacts_skill_version_idx ON skill_artifacts (skill_version_id);
CREATE INDEX IF NOT EXISTS scan_runs_skill_version_idx ON scan_runs (skill_version_id);
CREATE INDEX IF NOT EXISTS scan_findings_scan_run_idx ON scan_findings (scan_run_id);
CREATE INDEX IF NOT EXISTS skill_versions_review_queue_idx
  ON skill_versions (created_at)
  WHERE review_status IN ('unreviewed', 'changes-requested')
    OR (review_status = 'approved' AND published_at IS NULL);
