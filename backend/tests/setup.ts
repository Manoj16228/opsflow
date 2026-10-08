// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_access_key_12345';
process.env.JWT_REFRESH_SECRET = 'test_secret_refresh_key_67890';
process.env.DATABASE_URL = 'postgresql://opsflow_admin:opsflow_secure_password_2026@localhost:5432/opsflow_test?schema=public';
