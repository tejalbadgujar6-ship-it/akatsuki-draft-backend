import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { setupTestDB } from './setup.js';

const db = setupTestDB();

describe('Authentication APIs', () => {
  before(async () => await db.beforeAll());
  after(async () => await db.afterAll());
  beforeEach(async () => await db.beforeEach());

  describe('POST /auth/register', () => {
    it('should register a new user with valid data and return JWT token', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Naruto Uzumaki',
          email: 'naruto@konoha.dev',
          password: 'Password123'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.name, 'Naruto Uzumaki');
      assert.equal(res.body.data.user.email, 'naruto@konoha.dev');
      assert.equal(res.body.data.user.role, 'user');
      assert.ok(res.body.data.token, 'Token should be returned');
      assert.equal(res.body.data.user.password, undefined, 'Password should never be returned');

      // Verify password hashed in database
      const dbUser = await User.findOne({ email: 'naruto@konoha.dev' }).select('+password');
      assert.notEqual(dbUser.password, 'Password123');
      const isMatch = await dbUser.comparePassword('Password123');
      assert.equal(isMatch, true);
    });

    it('SECURITY RULE: must prevent public registration from assigning admin role', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Sneaky Admin Attempt',
          email: 'sneaky@test.com',
          password: 'Password123',
          role: 'admin' // Attempt privilege escalation
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.user.role, 'user', 'Role must be forced to user');

      const dbUser = await User.findOne({ email: 'sneaky@test.com' });
      assert.equal(dbUser.role, 'user', 'DB role must remain user');
    });

    it('should return 409 Conflict when registering with an existing email', async () => {
      await User.create({
        name: 'Existing Ninja',
        email: 'ninja@konoha.dev',
        password: 'Password123'
      });

      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Duplicate Ninja',
          email: 'ninja@konoha.dev',
          password: 'Password123'
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    it('should return 400 Bad Request for validation errors (short password, bad email)', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'J',
          email: 'not-an-email',
          password: '123'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(Array.isArray(res.body.errors));
      assert.ok(res.body.errors.length >= 2);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Sasuke Uchiha',
        email: 'sasuke@konoha.dev',
        password: 'Chidori@Password'
      });
    });

    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'sasuke@konoha.dev',
          password: 'Chidori@Password'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.email, 'sasuke@konoha.dev');
      assert.equal(res.body.data.user.password, undefined);
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'sasuke@konoha.dev',
          password: 'WrongPassword'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /invalid email or password/i);
    });

    it('should return 401 Unauthorized for non-existent email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'ghost@konoha.dev',
          password: 'Password123'
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('should return 400 Bad Request when email or password is missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'sasuke@konoha.dev' });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return authenticated user profile with valid Bearer token', async () => {
      const user = await User.create({
        name: 'Kakashi Hatake',
        email: 'kakashi@konoha.dev',
        password: 'Sharing@Password'
      });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'kakashi@konoha.dev', password: 'Sharing@Password' });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.email, 'kakashi@konoha.dev');
      assert.equal(res.body.data.user.name, 'Kakashi Hatake');
      assert.equal(res.body.data.user.role, 'user');
    });

    it('should return 401 Unauthorized when Authorization header is missing', async () => {
      const res = await request(app).get('/auth/me');
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('should return 401 Unauthorized for malformed or invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });
});
