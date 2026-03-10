-- ===========================================================================
-- ULMS Database Initialization Script
-- Creates separate databases for each microservice (Database-per-Service)
-- This runs ONLY on first PostgreSQL startup (when data volume is empty)
-- ===========================================================================

CREATE DATABASE lms_auth_db;
CREATE DATABASE lms_catalog_db;
CREATE DATABASE lms_member_db;
CREATE DATABASE lms_borrow_db;
CREATE DATABASE lms_fine_db;
CREATE DATABASE lms_notification_db;

-- Note: POSTGRES_USER (ulms_admin) is the superuser and automatically
-- has full privileges on all databases. No explicit GRANT needed.
