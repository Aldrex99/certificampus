import { api, auth, createSchoolContext, SchoolContext } from './helpers';
import { Student, Diploma } from '../src/models';

describe('Certifications feature', () => {
  let ctx: SchoolContext;
  let admisId: string;
  let ajourneId: string;

  beforeEach(async () => {
    ctx = await createSchoolContext();
    const admis = await Student.create({
      firstname: 'Ada', lastname: 'Lovelace', email: 'ada@s.com',
      school: ctx.schoolId, status: 'admis', grade: 'Très Bien',
    });
    const ajourne = await Student.create({
      firstname: 'Bob', lastname: 'Martin', email: 'bob@s.com',
      school: ctx.schoolId, status: 'ajourne',
    });
    admisId = String(admis._id);
    ajourneId = String(ajourne._id);
  });

  it('lists only admitted students as certifiable', async () => {
    const res = await api()
      .get('/api/v1/certifications/students')
      .set('Authorization', auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(admisId);
  });

  it('previews a diploma as HTML', async () => {
    const res = await api()
      .get(`/api/v1/certifications/preview/${admisId}`)
      .set('Authorization', auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.data.html).toContain('Ada Lovelace');
  });

  it('generates a diploma for an admitted student and marks it certified', async () => {
    const res = await api()
      .post('/api/v1/certifications/generate')
      .set('Authorization', auth(ctx.token))
      .send({ studentIds: [admisId] });
    expect(res.status).toBe(201);
    expect(res.body.data.generated).toHaveLength(1);
    expect(res.body.data.generated[0].qrToken).toBeDefined();

    const student = await Student.findById(admisId);
    expect(student?.isCertified).toBe(true);
  });

  it('skips non-admitted students (400 when none generated)', async () => {
    const res = await api()
      .post('/api/v1/certifications/generate')
      .set('Authorization', auth(ctx.token))
      .send({ studentIds: [ajourneId] });
    expect(res.status).toBe(400);
  });

  it('publishes a generated diploma', async () => {
    const gen = await api()
      .post('/api/v1/certifications/generate')
      .set('Authorization', auth(ctx.token))
      .send({ studentIds: [admisId] });
    const diplomaId = gen.body.data.generated[0]._id;

    const res = await api()
      .post('/api/v1/certifications/publish')
      .set('Authorization', auth(ctx.token))
      .send({ diplomaIds: [diplomaId], send: true });
    expect(res.status).toBe(200);
    expect(res.body.data.published).toBe(1);

    const diploma = await Diploma.findById(diplomaId);
    expect(diploma?.state).toBe('published');
  });

  it('verifies a diploma publicly by its QR token (no auth)', async () => {
    const gen = await api()
      .post('/api/v1/certifications/generate')
      .set('Authorization', auth(ctx.token))
      .send({ studentIds: [admisId] });
    const diploma = await Diploma.findById(gen.body.data.generated[0]._id);

    const res = await api().get(`/api/v1/verify/${diploma?.qrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.student).toBe('Ada Lovelace');
  });

  it('returns 404 verifying an unknown token', async () => {
    const res = await api().get('/api/v1/verify/does-not-exist');
    expect(res.status).toBe(404);
  });
});
