-- Add miss_reason column to responses table for tracking why questions were missed
ALTER TABLE responses 
ADD COLUMN miss_reason text NULL;

-- Add a comment explaining the allowed values
COMMENT ON COLUMN responses.miss_reason IS 'Reason for missing: misread, rushed, forgot_rule, arithmetic, rabbit_hole, didnt_know, other';