CREATE TABLE artifact_write_intents (
  storage_key text PRIMARY KEY,
  state text NOT NULL DEFAULT 'reserved'
    CHECK (state IN ('reserved', 'object_written')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX artifact_write_intents_state_idx
  ON artifact_write_intents (state, updated_at);
