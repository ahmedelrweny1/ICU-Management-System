-- ============================================
-- Shefaa ICU Management System
-- Complete Database Setup Script
-- 
-- INSTRUCTIONS:
-- 1. Execute this script to create the database
-- 2. Then execute DDL_Script.sql to create tables
-- 3. Finally execute DML_Script.sql to insert sample data
-- 
-- OR use SQL Server Management Studio with:
-- :r "DDL_Script.sql"
-- :r "DML_Script.sql"
-- ============================================

-- ============================================
-- STEP 1: Create Database
-- ============================================
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'ShefaaICU')
BEGIN
    PRINT 'Dropping existing database...';
    ALTER DATABASE [ShefaaICU] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [ShefaaICU];
END
GO

PRINT 'Creating database...';
CREATE DATABASE [ShefaaICU];
GO

USE [ShefaaICU];
GO

PRINT 'Database created successfully!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Execute DDL_Script.sql to create tables';
PRINT '2. Execute DML_Script.sql to insert sample data';
GO

