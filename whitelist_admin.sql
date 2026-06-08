-- Whitelist the provided email as SuperAdmin
-- Assuming 'users' table structure from database-design.md: 
-- id (uuid), email (unique), password_hash, role (SuperAdmin/BranchManager/Cashier), active

INSERT INTO users (id, email, password_hash, role, active)
VALUES (
    gen_random_uuid(),
    'brioneroo@gmail.com',
    -- Default password hash for 'password123' (replace later)
    '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiCR/TgVF0v.X7bA5aX8N9B.Xm1B2e', 
    'SuperAdmin',
    true
)
ON CONFLICT (email) 
DO UPDATE SET 
    role = 'SuperAdmin',
    active = true;
