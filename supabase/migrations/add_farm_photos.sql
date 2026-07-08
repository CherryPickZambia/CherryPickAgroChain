-- Farm photos gallery on farmer profiles (traceability / Meet Your Farmer).
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS farm_photos TEXT[] DEFAULT '{}';
