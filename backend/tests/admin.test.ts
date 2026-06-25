import { Types } from 'mongoose';
import { api, auth, createAdminContext, createSchoolContext } from './helpers';
import { School, Subscription, TemplateDiploma, User } from '../src/models';

describe('Admin feature', () => {
  let adminToken: string;
  beforeEach(async () => {
    adminToken = (await createAdminContext()).token;
  });

  it('blocks non-admins from admin routes (403)', async () => {
    const school = await createSchoolContext();
    const res = await api()
      .get('/api/v1/admin/dashboard')
      .set('Authorization', auth(school.token));
    expect(res.status).toBe(403);
  });

  describe('dashboard', () => {
    it('returns global totals', async () => {
      await School.create({ label: 'S1', owner: new Types.ObjectId() });
      const res = await api()
        .get('/api/v1/admin/dashboard')
        .set('Authorization', auth(adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.totals.schools).toBeGreaterThanOrEqual(1);
    });
  });

  describe('schools', () => {
    it('creates a school with its responsable account', async () => {
      const res = await api()
        .post('/api/v1/admin/schools')
        .set('Authorization', auth(adminToken))
        .send({
          label: 'Nouvelle École',
          ownerFirstname: 'Paul',
          ownerLastname: 'Durand',
          ownerEmail: 'paul@ecole.com',
        });
      expect(res.status).toBe(201);
      const owner = await User.findOne({ email: 'paul@ecole.com' });
      expect(owner).not.toBeNull();
      expect(owner?.isVerified).toBe(false);
    });

    it('lists, updates and deletes schools', async () => {
      const create = await api()
        .post('/api/v1/admin/schools')
        .set('Authorization', auth(adminToken))
        .send({ label: 'École A', ownerFirstname: 'A', ownerLastname: 'B', ownerEmail: 'a@e.com' });
      const id = create.body.data._id;

      const list = await api().get('/api/v1/admin/schools').set('Authorization', auth(adminToken));
      expect(list.body.data.total).toBeGreaterThanOrEqual(1);

      const upd = await api()
        .put(`/api/v1/admin/schools/${id}`)
        .set('Authorization', auth(adminToken))
        .send({ isActive: false });
      expect(upd.body.data.isActive).toBe(false);

      const del = await api()
        .delete(`/api/v1/admin/schools/${id}`)
        .set('Authorization', auth(adminToken));
      expect(del.status).toBe(204);
    });

    it('filters schools by name via search', async () => {
      await api().post('/api/v1/admin/schools').set('Authorization', auth(adminToken))
        .send({ label: 'Sorbonne', ownerFirstname: 'X', ownerLastname: 'Y', ownerEmail: 'x@e.com' });
      await api().post('/api/v1/admin/schools').set('Authorization', auth(adminToken))
        .send({ label: 'Polytechnique', ownerFirstname: 'Z', ownerLastname: 'W', ownerEmail: 'z@e.com' });

      const res = await api()
        .get('/api/v1/admin/schools?search=sorb')
        .set('Authorization', auth(adminToken));
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].label).toBe('Sorbonne');
    });
  });

  describe('subscriptions', () => {
    it('creates, updates and deletes a subscription', async () => {
      const create = await api()
        .post('/api/v1/admin/subscriptions')
        .set('Authorization', auth(adminToken))
        .send({ name: 'Pro', type: 'yearly', price: 299, status: 'active' });
      expect(create.status).toBe(201);
      const id = create.body.data._id;

      const upd = await api()
        .put(`/api/v1/admin/subscriptions/${id}`)
        .set('Authorization', auth(adminToken))
        .send({ price: 199 });
      expect(upd.body.data.price).toBe(199);

      const del = await api()
        .delete(`/api/v1/admin/subscriptions/${id}`)
        .set('Authorization', auth(adminToken));
      expect(del.status).toBe(204);
      expect(await Subscription.countDocuments({})).toBe(0);
    });
  });

  describe('templates', () => {
    it('creates a default template (unsets previous default)', async () => {
      await TemplateDiploma.create({ name: 'Old', content: 'x', isDefault: true, school: null });
      const res = await api()
        .post('/api/v1/admin/templates')
        .set('Authorization', auth(adminToken))
        .send({ name: 'New', content: '<div>{{studentName}}</div>', isDefault: true });
      expect(res.status).toBe(201);

      const defaults = await TemplateDiploma.find({ school: null, isDefault: true });
      expect(defaults).toHaveLength(1);
      expect(defaults[0].name).toBe('New');
    });
  });
});
