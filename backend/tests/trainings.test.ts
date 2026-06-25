import { api, auth, createSchoolContext, SchoolContext } from './helpers';
import { Training } from '../src/models';

describe('Trainings feature', () => {
  let ctx: SchoolContext;
  beforeEach(async () => {
    ctx = await createSchoolContext();
  });

  it('creates a training (201)', async () => {
    const res = await api()
      .post('/api/v1/trainings')
      .set('Authorization', auth(ctx.token))
      .send({ label: 'Master Dev Web', level: 'Master' });
    expect(res.status).toBe(201);
    expect(res.body.data.label).toBe('Master Dev Web');
  });

  it('rejects creation without a label (400)', async () => {
    const res = await api()
      .post('/api/v1/trainings')
      .set('Authorization', auth(ctx.token))
      .send({ level: 'Master' });
    expect(res.status).toBe(400);
  });

  it('lists, updates and deletes trainings', async () => {
    const t = await Training.create({ label: 'BTS SIO', school: ctx.schoolId });

    const list = await api().get('/api/v1/trainings').set('Authorization', auth(ctx.token));
    expect(list.body.data.total).toBe(1);

    const upd = await api()
      .put(`/api/v1/trainings/${t._id}`)
      .set('Authorization', auth(ctx.token))
      .send({ label: 'BTS SIO SLAM' });
    expect(upd.body.data.label).toBe('BTS SIO SLAM');

    const del = await api()
      .delete(`/api/v1/trainings/${t._id}`)
      .set('Authorization', auth(ctx.token));
    expect(del.status).toBe(204);
    expect(await Training.countDocuments({ school: ctx.schoolId })).toBe(0);
  });
});
