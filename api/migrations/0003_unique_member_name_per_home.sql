CREATE UNIQUE INDEX uq_members_home_normalized_name
  ON members(home_id, lower(trim(name)));
