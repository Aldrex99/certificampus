import { api, auth, createSchoolContext, SchoolContext } from './helpers';
import { Student } from '../src/models';

describe('School dashboard', () => {
  let ctx: SchoolContext;
  beforeEach(async () => {
    ctx = await createSchoolContext();
    await Student.create([
      { firstname: 'A', lastname: 'A', email: 'a@s.com', school: ctx.schoolId, status: 'admis' },
      { firstname: 'B', lastname: 'B', email: 'b@s.com', school: ctx.schoolId, status: 'admis' },
      { firstname: 'C', lastname: 'C', email: 'c@s.com', school: ctx.schoolId, status: 'ajourne' },
    ]);
  });

  it('returns success and certification aggregates', async () => {
    const res = await api().get('/api/v1/dashboard').set('Authorization', auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.data.totals.students).toBe(3);
    expect(res.body.data.success.admis).toBe(2);
    expect(res.body.data.success.ajourne).toBe(1);
    expect(res.body.data.certification.notCertified).toBe(3);
    expect(res.body.data.yearlyTrend).toHaveLength(3);
  });

  it('forbids admins from the school dashboard', async () => {
    const res = await api().get('/api/v1/dashboard'); // no token
    expect(res.status).toBe(401);
  });
});
