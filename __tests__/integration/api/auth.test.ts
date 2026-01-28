/**
 * Integration tests for authentication API routes
 * These tests require a test database setup
 */

describe('Auth API Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should create a new user with valid data', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('userId');
    });

    it('should reject duplicate email', async () => {
      // First registration
      await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      // Second registration with same email
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('already exists');
    });

    it('should reject missing required fields', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password, firstName, lastName
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'old',
          newPassword: 'new',
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});

