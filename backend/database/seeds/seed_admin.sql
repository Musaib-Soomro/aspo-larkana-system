-- Default admin: username=aspo_larkana, password=Admin@1234
-- Password hash generated with bcrypt cost factor 12.
-- IMPORTANT: Change this password immediately after first login via Settings page.
INSERT INTO users (username, password_hash, full_name, role)
VALUES (
  'aspo_larkana',
  '$2b$12$X.D/QavWMyliPDEExROIX.0zohqRL.zsIPvZSknOfBLFhV2PQtGmy',
  'Musaib Soomro',
  'admin'
)
ON CONFLICT (username) DO NOTHING;
