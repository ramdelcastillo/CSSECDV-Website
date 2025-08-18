\c cssecdv_db;

SET session_replication_role = 'replica';

TRUNCATE TABLE posts RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE comments RESTART IDENTITY CASCADE;

SET session_replication_role = 'origin';
