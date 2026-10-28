import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import { setupTestDB } from './setup.js';
import { generateToken } from '../src/controllers/authController.js';

const db = setupTestDB();

describe('Google Gemini AI Integration APIs', () => {
  let user1, token1;
  let user2, token2;
  let post1;

  before(async () => await db.beforeAll());
  after(async () => await db.afterAll());

  beforeEach(async () => {
    await db.beforeEach();

    // Create user 1
    user1 = await User.create({
      name: 'Konan',
      email: 'konan@akatsuki.dev',
      password: 'Origami@Password',
      role: 'user'
    });
    token1 = generateToken(user1);

    // Create user 2
    user2 = await User.create({
      name: 'Sasori',
      email: 'sasori@akatsuki.dev',
      password: 'PuppetMaster123',
      role: 'user'
    });
    token2 = generateToken(user2);

    // Create a post for user 1
    post1 = await Post.create({
      title: 'Paper Origami Techniques',
      description: 'Folding paper into weapons and scouts.',
      content: 'origami is ancient art. with chakra paper can be hard as steel and sharp as blade. we can fold thousands of paper butterflies.',
      category: 'Art',
      createdBy: user1._id,
      status: 'draft'
    });
  });

  describe('POST /ai/improve/:postId', () => {
    it('CRITICAL: should improve content and save as a NEW draft with NEW ID, preserving original post unchanged', async () => {
      const originalPostBefore = await Post.findById(post1._id);

      const res = await request(app)
        .post(`/ai/improve/${post1._id}`)
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.newDraft);

      const newDraft = res.body.data.newDraft;

      // 1. New document has a NEW MongoDB ID
      assert.notEqual(newDraft._id.toString(), post1._id.toString());

      // 2. Associated with the same user
      assert.equal(newDraft.createdBy._id.toString(), user1._id.toString());

      // 3. Saved with status: "draft"
      assert.equal(newDraft.status, 'draft');

      // 4. Content is improved
      assert.ok(newDraft.content);
      assert.notEqual(newDraft.content, originalPostBefore.content);

      // 5. CRITICAL: Original post MUST remain 100% UNCHANGED in database
      const originalPostAfter = await Post.findById(post1._id);
      assert.equal(originalPostAfter._id.toString(), originalPostBefore._id.toString());
      assert.equal(originalPostAfter.title, originalPostBefore.title);
      assert.equal(originalPostAfter.description, originalPostBefore.description);
      assert.equal(originalPostAfter.content, originalPostBefore.content);
      assert.equal(originalPostAfter.status, originalPostBefore.status);

      // Total posts in DB should now be 2
      const count = await Post.countDocuments();
      assert.equal(count, 2);
    });

    it('SECURITY RULE: user cannot improve another user post (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/ai/improve/${post1._id}`)
        .set('Authorization', `Bearer ${token2}`); // User 2 trying to improve User 1's post

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not authorized to improve this post/i);
    });

    it('should return 404 if post does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/ai/improve/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });

    it('should return 400 Bad Request for an invalid MongoDB ObjectId', async () => {
      const res = await request(app)
        .post('/ai/improve/invalid-post-id-123')
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 400);
      assert.match(res.body.message, /invalid postId/i);
    });

    it('should return 401 Unauthorized if not authenticated', async () => {
      const res = await request(app).post(`/ai/improve/${post1._id}`);
      assert.equal(res.status, 401);
    });
  });
});
