-- migration_add_reset_pin.sql
-- Run this in MySQL Workbench ONCE to add PIN columns to existing users table
-- Safe to run: only adds columns, does NOT delete any data

USE authdb;

ALTER TABLE users
ADD COLUMN reset_pin VARCHAR(6) DEFAULT NULL;

ALTER TABLE users
ADD COLUMN reset_pin_expires DATETIME DEFAULT NULL;

SELECT email, reset_pin, reset_pin_expires 
FROM users WHERE reset_pin IS NOT NULL;

update users set reset_pin_expires = '2026-08-06 15:12:50' where email = 'test@user.com'

update users set reset_pin_expires = '2026-08-06 15:12:50' where id = 4;
