import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import { setupTestDB } from './setup.js';
import { generateToken } from '../src/controllers/authController.js';

const db = setupTestDB();

describe('Admin Post Approval APIs', () => {
  let adminUser, adminToken;
  let normalUser, normalToken;
  let pendingPost;

  before(async () => await db.beforeAll());
  after(async () => await db.afterAll());

  beforeEach(async () => {
    await db.beforeEach();

    // Create an Admin user
    adminUser = await User.create({
      name: 'Pain (Nagato)',
      email: 'pain@akatsuki.dev',
      password: 'Rinnegan@Password',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // Create a Normal user
    normalUser = await User.create({
      name: 'Deidara',
      email: 'deidara@akatsuki.dev',
      password: 'ArtIsAnExplosion',
      role: 'user'
    });
    normalToken = generateToken(normalUser);

    // Create a post awaiting review
    pendingPost = await Post.create({
      title: 'Art is an Explosion',
      description: 'The fleeting beauty of clay detonators.',
      content: 'True art is a blast that vanishes in a split second.',
      category: 'Art',
      createdBy: normalUser._id,
      status: 'pending'
    });
  });

  describe('GET /admin/posts/pending', () => {
    it('should allow admin to view all pending posts', async () => {
      const res = await request(app)
        .get('/admin/posts/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.posts.length, 1);
      assert.equal(res.body.data.posts[0]._id.toString(), pendingPost._id.toString());
      assert.equal(res.body.data.posts[0].status, 'pending');
    });

    it('SECURITY RULE: normal user cannot access admin pending posts (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/admin/posts/pending')
        .set('Authorization', `Bearer ${normalToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /access denied/i);
    });

    it('should return 401 Unauthorized if not logged in', async () => {
      const res = await request(app).get('/admin/posts/pending');
      assert.equal(res.status, 401);
    });
  });

  describe('PATCH /admin/posts/approve/:id', () => {
    it('should allow admin to approve a pending post', async () => {
      const res = await request(app)
        .patch(`/admin/posts/approve/${pendingPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'approved');

      // Verify the post is now publicly accessible
      const publicRes = await request(app).get(`/posts/${pendingPost._id}`);
      assert.equal(publicRes.status, 200);
      assert.equal(publicRes.body.data.title, 'Art is an Explosion');
    });

    it('SECURITY RULE: normal user cannot approve posts (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/admin/posts/approve/${pendingPost._id}`)
        .set('Authorization', `Bearer ${normalToken}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);

      // Verify post remained pending in database
      const postInDb = await Post.findById(pendingPost._id);
      assert.equal(postInDb.status, 'pending');
    });

    it('should return 404 if post does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .patch(`/admin/posts/approve/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 404);
    });
  });

  describe('PATCH /admin/posts/reject/:id', () => {
    it('should allow admin to reject a pending post', async () => {
      const res = await request(app)
        .patch(`/admin/posts/reject/${pendingPost._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'rejected');

      // Verify post is NOT accessible in public feed
      const publicFeed = await request(app).get('/posts');
      assert.equal(publicFeed.body.data.posts.length, 0);

      // Verify post is NOT accessible by ID publicly
      const publicRes = await request(app).get(`/posts/${pendingPost._id}`);
      assert.equal(publicRes.status, 404);
    });

    it('SECURITY RULE: normal user cannot reject posts (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/admin/posts/reject/${pendingPost._id}`)
        .set('Authorization', `Bearer ${normalToken}`);

      assert.equal(res.status, 403);
    });
  });
});
