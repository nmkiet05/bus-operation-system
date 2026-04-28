UPDATE users SET password = '$2a$10$ctZhvcVS17Q2eJGNuOcp5uN8NciZwKZBuDZRJVGixpMet0a3ZPIja' WHERE username = 'admin' RETURNING username, LENGTH(password) as pwd_len;
