import { api, auth, createSchoolContext, SchoolContext } from './helpers';

describe('School settings', () => {
  let ctx: SchoolContext;
  beforeEach(async () => {
    ctx = await createSchoolContext();
  });

  it('returns the current profile and school', async () => {
    const res = await api().get('/api/v1/settings/profile').set('Authorization', auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(ctx.email);
    expect(res.body.data.school.label).toBe('École Test');
  });

  it('updates profile information', async () => {
    const res = await api()
      .put('/api/v1/settings/profile')
      .set('Authorization', auth(ctx.token))
      .send({ firstname: 'Marie-Claire', schoolName: 'École Polytechnique' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.firstname).toBe('Marie-Claire');
    expect(res.body.data.school.label).toBe('École Polytechnique');
  });

  it('changes the password with the correct current password', async () => {
    const res = await api()
      .put('/api/v1/settings/password')
      .set('Authorization', auth(ctx.token))
      .send({ currentPassword: 'Password1', newPassword: 'NewPass123', confirmPassword: 'NewPass123' });
    expect(res.status).toBe(200);

    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: ctx.email, password: 'NewPass123' });
    expect(login.status).toBe(200);
  });

  it('rejects password change with a wrong current password (400)', async () => {
    const res = await api()
      .put('/api/v1/settings/password')
      .set('Authorization', auth(ctx.token))
      .send({ currentPassword: 'WrongPass1', newPassword: 'NewPass123', confirmPassword: 'NewPass123' });
    expect(res.status).toBe(400);
  });

  it('rejects mismatched confirmation (400)', async () => {
    const res = await api()
      .put('/api/v1/settings/password')
      .set('Authorization', auth(ctx.token))
      .send({ currentPassword: 'Password1', newPassword: 'NewPass123', confirmPassword: 'Other123' });
    expect(res.status).toBe(400);
  });
});
