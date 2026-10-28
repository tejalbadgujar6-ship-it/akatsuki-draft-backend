import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import { setupTestDB } from './setup.js';

const db = setupTestDB();

describe('User Post Management APIs', () => {
  let user1, token1;
  let user2, token2;

  before(async () => await db.beforeAll());
  after(async () => await db.afterAll());

  beforeEach(async () => {
    await db.beforeEach();

    // Create user 1
    const res1 = await request(app).post('/auth/register').send({
      name: 'Itachi Uchiha',
      email: 'itachi@akatsuki.dev',
      password: 'Mangekyo@Password'
    });
    token1 = res1.body.data.token;
    user1 = res1.body.data.user;

    // Create user 2
    const res2 = await request(app).post('/auth/register').send({
      name: 'Kisame Hoshigaki',
      email: 'kisame@akatsuki.dev',
      password: 'Samehada@Password'
    });
    token2 = res2.body.data.token;
    user2 = res2.body.data.user;
  });

  describe('POST /posts', () => {
    it('should create a new post with status pending when submitted for publication', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Philosophy of the Akatsuki',
          description: 'A deep dive into the mission for global peace.',
          content: 'True peace can only be understood through pain and reflection.',
          category: 'Philosophy'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'pending', 'Must enter pending state for review');
      assert.equal(res.body.data.title, 'Philosophy of the Akatsuki');
      assert.equal(res.body.data.createdBy._id.toString(), user1.id);
    });

    it('should save a post as draft when requested', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Unfinished Strategy Notes',
          description: 'Draft notes on Jinchuriki capture.',
          content: 'First target should be the One-Tail in Sunagakure.',
          category: 'Strategy',
          status: 'draft'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.status, 'draft', 'Draft must remain in draft state');
    });

    it('SECURITY RULE: normal user cannot force post to approved status directly', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Attempting to Bypass Review',
          description: 'Trying to publish without admin approval.',
          content: 'This should not be approved directly.',
          category: 'Exploit',
          status: 'approved' // Forbidden override
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.status, 'pending', 'Status must be forced to pending');
    });

    it('should reject creation if title, description, or content is missing', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'No Content'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe('GET /posts (Public Feed)', () => {
    beforeEach(async () => {
      // Create approved post
      await Post.create({
        title: 'Approved Public Article',
        description: 'This is visible to all users.',
        content: 'Publicly readable content.',
        category: 'Technology',
        createdBy: user1.id,
        status: 'approved'
      });

      // Create draft post
      await Post.create({
        title: 'Secret Draft Article',
        description: 'Not yet ready.',
        content: 'Draft content.',
        category: 'Private',
        createdBy: user1.id,
        status: 'draft'
      });

      // Create pending post
      await Post.create({
        title: 'Pending Review Article',
        description: 'Awaiting admin.',
        content: 'Pending content.',
        category: 'News',
        createdBy: user1.id,
        status: 'pending'
      });

      // Create rejected post
      await Post.create({
        title: 'Rejected Post',
        description: 'Admin rejected this.',
        content: 'Rejected content.',
        category: 'News',
        createdBy: user1.id,
        status: 'rejected'
      });
    });

    it('CRITICAL: must ONLY return approved posts, never drafts, pending, or rejected', async () => {
      const res = await request(app).get('/posts');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.posts.length, 1);
      assert.equal(res.body.data.posts[0].title, 'Approved Public Article');
      assert.equal(res.body.data.posts[0].status, 'approved');
    });
  });

  describe('GET /posts/:id (Public Individual Post)', () => {
    let approvedPost, pendingPost, draftPost;

    beforeEach(async () => {
      approvedPost = await Post.create({
        title: 'Public Masterpiece',
        description: 'Approved for public consumption.',
        content: 'Full public details here.',
        category: 'Art',
        createdBy: user1.id,
        status: 'approved'
      });

      pendingPost = await Post.create({
        title: 'Pending Work',
        description: 'Waiting on approval.',
        content: 'Private details.',
        category: 'Art',
        createdBy: user1.id,
        status: 'pending'
      });

      draftPost = await Post.create({
        title: 'My Private Draft',
        description: 'Private draft.',
        content: 'Private details.',
        category: 'Art',
        createdBy: user1.id,
        status: 'draft'
      });
    });

    it('should return 200 and details for an approved post', async () => {
      const res = await request(app).get(`/posts/${approvedPost._id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.title, 'Public Masterpiece');
    });

    it('should return 404 for a post that exists but is pending approval', async () => {
      const res = await request(app).get(`/posts/${pendingPost._id}`);
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not approved/i);
    });

    it('should return 404 for a post that is a draft', async () => {
      const res = await request(app).get(`/posts/${draftPost._id}`);
      assert.equal(res.status, 404);
    });

    it('should return 400 Bad Request for an invalid MongoDB ObjectId', async () => {
      const res = await request(app).get('/posts/invalid-id-format-123');
      assert.equal(res.status, 400);
      assert.match(res.body.message, /invalid id/i);
    });
  });

  describe('GET /posts/my-posts', () => {
    beforeEach(async () => {
      await Post.create([
        {
          title: 'My Approved Post',
          description: 'Desc 1',
          content: 'Content 1',
          createdBy: user1.id,
          status: 'approved'
        },
        {
          title: 'My Draft Post',
          description: 'Desc 2',
          content: 'Content 2',
          createdBy: user1.id,
          status: 'draft'
        },
        {
          title: 'Kisame Post',
          description: 'Desc 3',
          content: 'Content 3',
          createdBy: user2.id,
          status: 'draft'
        }
      ]);
    });

    it('should return all posts belonging to the authenticated user', async () => {
      const res = await request(app)
        .get('/posts/my-posts')
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.posts.length, 2);
      res.body.data.posts.forEach((p) => {
        assert.equal(p.createdBy.toString(), user1.id);
      });
    });

    it('should allow filtering own posts by status', async () => {
      const res = await request(app)
        .get('/posts/my-posts?status=draft')
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.posts.length, 1);
      assert.equal(res.body.data.posts[0].status, 'draft');
    });
  });

  describe('PATCH /posts/:id (Update Post)', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Original Title',
        description: 'Original description.',
        content: 'Original content.',
        createdBy: user1.id,
        status: 'approved' // Currently approved
      });
    });

    it('CRITICAL RULE: editing an approved post resets status to pending for admin review', async () => {
      const res = await request(app)
        .patch(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Modified content that needs re-review.'
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.content, 'Modified content that needs re-review.');
      assert.equal(
        res.body.data.status,
        'pending',
        'Status must revert to pending after editing approved post'
      );
    });

    it('should prevent user from updating another user post (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token2}`) // User 2 trying to edit User 1's post
        .send({
          title: 'Malicious Hijack'
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);
    });

    it('should prevent modifying protected fields like createdBy', async () => {
      const res = await request(app)
        .patch(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          createdBy: user2.id
        });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /protected system fields/i);
    });
  });

  describe('DELETE /posts/:id (Delete Post)', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Post to Delete',
        description: 'Going away soon.',
        content: 'Bye.',
        createdBy: user1.id,
        status: 'draft'
      });
    });

    it('should allow author to delete their own post', async () => {
      const res = await request(app)
        .delete(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token1}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);

      const exists = await Post.findById(post._id);
      assert.equal(exists, null);
    });

    it('should prevent other users from deleting author post (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/posts/${post._id}`)
        .set('Authorization', `Bearer ${token2}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.success, false);

      const exists = await Post.findById(post._id);
      assert.ok(exists);
    });
  });
});
