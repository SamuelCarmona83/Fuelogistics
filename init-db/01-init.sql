-- Initialize fuel truck management database
-- This script creates the initial database structure

-- Create database if it doesn't exist
-- (This is handled by the postgres Docker container)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (password will be hashed by the application)
-- The application will handle user creation through the registration process