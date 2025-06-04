-- Add emr_id column to proposed_plan table
ALTER TABLE proposed_plan
ADD COLUMN emr_id UUID NOT NULL,
ADD CONSTRAINT fk_emr_id FOREIGN KEY (emr_id) REFERENCES turn_emr(emr_id);