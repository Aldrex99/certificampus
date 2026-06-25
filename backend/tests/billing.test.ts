import { api, auth, createSchoolContext, SchoolContext } from './helpers';
import { Plan, Subscription, Student } from '../src/models';

describe('Billing & certificate quota', () => {
  describe('plans & checkout (mock mode)', () => {
    let ctx: SchoolContext;

    beforeEach(async () => {
      // No subscription yet; we drive it through the checkout flow.
      ctx = await createSchoolContext('billing@example.com', { quota: 0 });
      await Plan.create({
        name: 'Starter',
        price: 49,
        interval: 'month',
        certificateQuota: 50,
        isActive: true,
      });
    });

    it('lists active plans for the school', async () => {
      const res = await api()
        .get('/api/v1/billing/plans')
        .set('Authorization', auth(ctx.token));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Starter');
    });

    it('reports no active subscription initially', async () => {
      const res = await api()
        .get('/api/v1/billing/subscription')
        .set('Authorization', auth(ctx.token));
      expect(res.status).toBe(200);
      expect(res.body.data.plan).toBeNull();
      expect(res.body.data.remaining).toBe(0);
    });

    it('activates the subscription instantly in mock mode on checkout', async () => {
      const plan = await Plan.findOne({ name: 'Starter' });
      const res = await api()
        .post('/api/v1/billing/checkout')
        .set('Authorization', auth(ctx.token))
        .send({ planId: String(plan?._id) });
      expect(res.status).toBe(200);
      expect(res.body.data.mocked).toBe(true);
      expect(res.body.data.url).toContain('checkout=success');

      const sub = await Subscription.findOne({ school: ctx.schoolId });
      expect(sub?.status).toBe('active');
      expect(sub?.usedThisPeriod).toBe(0);
    });
  });

  describe('quota enforcement on generation', () => {
    it('blocks generation when the school has no active subscription (402)', async () => {
      const ctx = await createSchoolContext('noplan@example.com', { quota: 0 });
      const student = await Student.create({
        firstname: 'Ada', lastname: 'Lovelace', email: 'ada@s.com',
        school: ctx.schoolId, status: 'admis', grade: 'Bien',
      });

      const res = await api()
        .post('/api/v1/certifications/generate')
        .set('Authorization', auth(ctx.token))
        .send({ studentIds: [String(student._id)] });

      expect(res.status).toBe(402);
    });

    it('blocks generation when the period quota would be exceeded (402)', async () => {
      const ctx = await createSchoolContext('tight@example.com', { quota: 1 });
      const s1 = await Student.create({
        firstname: 'A', lastname: 'One', email: 'a@s.com',
        school: ctx.schoolId, status: 'admis',
      });
      const s2 = await Student.create({
        firstname: 'B', lastname: 'Two', email: 'b@s.com',
        school: ctx.schoolId, status: 'admis',
      });

      const res = await api()
        .post('/api/v1/certifications/generate')
        .set('Authorization', auth(ctx.token))
        .send({ studentIds: [String(s1._id), String(s2._id)] });

      expect(res.status).toBe(402);
      // Nothing consumed when the whole batch is rejected.
      const sub = await Subscription.findOne({ school: ctx.schoolId });
      expect(sub?.usedThisPeriod).toBe(0);
    });

    it('increments usage when within quota', async () => {
      const ctx = await createSchoolContext('ok@example.com', { quota: 5 });
      const student = await Student.create({
        firstname: 'Grace', lastname: 'Hopper', email: 'grace@s.com',
        school: ctx.schoolId, status: 'admis', grade: 'Très Bien',
      });

      const res = await api()
        .post('/api/v1/certifications/generate')
        .set('Authorization', auth(ctx.token))
        .send({ studentIds: [String(student._id)] });

      expect(res.status).toBe(201);
      const sub = await Subscription.findOne({ school: ctx.schoolId });
      expect(sub?.usedThisPeriod).toBe(1);
    });
  });
});
