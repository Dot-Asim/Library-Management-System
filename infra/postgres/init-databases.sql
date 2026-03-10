-- ===========================================================================
-- ULMS Database Initialization Script
-- Creates separate databases for each microservice (Database-per-Service)
-- This runs ONLY on first PostgreSQL startup (when data volume is empty)
-- Uses IF NOT EXISTS pattern to avoid failure when POSTGRES_DB pre-creates one
-- ===========================================================================

SELECT 'CREATE DATABASE lms_auth_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_auth_db')\gexec
SELECT 'CREATE DATABASE lms_catalog_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_catalog_db')\gexec
SELECT 'CREATE DATABASE lms_member_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_member_db')\gexec
SELECT 'CREATE DATABASE lms_borrow_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_borrow_db')\gexec
SELECT 'CREATE DATABASE lms_fine_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_fine_db')\gexec
SELECT 'CREATE DATABASE lms_notification_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_notification_db')\gexec

-- Note: POSTGRES_USER (ulms_admin) is the superuser and automatically
-- has full privileges on all databases. No explicit GRANT needed.
