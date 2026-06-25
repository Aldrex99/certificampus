import { api } from './helpers';
import { User, School } from '../src/models';
import { hashPassword } from '../src/utils/password';

describe('Auth feature', () => {
  const validRegister = {
    firstname: 'Alan',
    lastname: 'Turing',
    email: 'alan@school.com',
    password: 'Secret123',
    schoolName: 'Bletchley Park',
  };

  describe('POST /auth/register', () => {
    it('creates a school account and returns 201', async () => {
      const res = await api().post('/api/v1/auth/register').send(validRegister);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const user = await User.findOne({ email: validRegister.email });
      expect(user).not.toBeNull();
      expect(user?.role).toBe('school');
      expect(user?.isVerified).toBe(false);
      expect(user?.school).toBeDefined();
    });

    it('rejects a weak password with 400', async () => {
      const res = await api()
        .post('/api/v1/auth/register')
        .send({ ...validRegister, password: 'short' });
      expect(res.status).toBe(400);
    });

    it('rejects an invalid email with 400', async () => {
      const res = await api()
        .post('/api/v1/auth/register')
        .send({ ...validRegister, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('rejects a duplicate email with 409', async () => {
      await api().post('/api/v1/auth/register').send(validRegister);
      const res = await api().post('/api/v1/auth/register').send(validRegister);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await User.create({
        firstname: 'Grace',
        lastname: 'Hopper',
        email: 'grace@school.com',
        password: await hashPassword('Password1'),
        role: 'school',
        isVerified: true,
      });
    });

    it('sets auth cookies and returns the user on valid credentials', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'grace@school.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('grace@school.com');
      // No token in the body — they live in httpOnly cookies.
      expect(res.body.data.token).toBeUndefined();
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
      expect(cookies.every((c) => /HttpOnly/i.test(c))).toBe(true);
    });

    it('rejects wrong password with 401', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'grace@school.com', password: 'WrongPass1' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email with 401', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@school.com', password: 'Password1' });
      expect(res.status).toBe(401);
    });
  });

  describe('token refresh + logout', () => {
    async function loginAndGetCookies(): Promise<string[]> {
      const user = await User.create({
        firstname: 'Linus',
        lastname: 'Torvalds',
        email: 'linus@school.com',
        password: await hashPassword('Password1'),
        role: 'school',
        isVerified: true,
      });
      const school = await School.create({ label: 'École Linux', owner: user._id });
      user.school = school._id as never;
      await user.save();
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'linus@school.com', password: 'Password1' });
      return res.headers['set-cookie'] as unknown as string[];
    }

    it('rotates tokens via the refresh cookie', async () => {
      const cookies = await loginAndGetCookies();
      const res = await api().post('/api/v1/auth/refresh').set('Cookie', cookies);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('linus@school.com');
      const fresh = res.headers['set-cookie'] as unknown as string[];
      expect(fresh.some((c) => c.startsWith('accessToken='))).toBe(true);
      expect(fresh.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('rejects refresh without a cookie (401)', async () => {
      const res = await api().post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('invalidates the refresh token after logout', async () => {
      const cookies = await loginAndGetCookies();
      const logoutRes = await api().post('/api/v1/auth/logout').set('Cookie', cookies);
      expect(logoutRes.status).toBe(204);

      // Reusing the old refresh cookie must now fail.
      const res = await api().post('/api/v1/auth/refresh').set('Cookie', cookies);
      expect(res.status).toBe(401);
    });

    it('allows access to a protected route via the access cookie', async () => {
      const cookies = await loginAndGetCookies();
      const accessCookie = cookies.find((c) => c.startsWith('accessToken='))!.split(';')[0];
      const res = await api().get('/api/v1/dashboard').set('Cookie', accessCookie);
      expect(res.status).toBe(200);
    });
  });

  describe('activation + password reset', () => {
    it('activates an account with a valid token', async () => {
      await api().post('/api/v1/auth/register').send(validRegister);
      const user = await User.findOne({ email: validRegister.email }).select('+activationToken');
      const res = await api()
        .post('/api/v1/auth/activate')
        .send({ email: validRegister.email, token: user?.activationToken });
      expect(res.status).toBe(200);
      const refreshed = await User.findOne({ email: validRegister.email });
      expect(refreshed?.isVerified).toBe(true);
    });

    it('rejects activation with a wrong token (403)', async () => {
      await api().post('/api/v1/auth/register').send(validRegister);
      const res = await api()
        .post('/api/v1/auth/activate')
        .send({ email: validRegister.email, token: 'wrong-token' });
      expect(res.status).toBe(403);
    });

    it('returns 204 on forgot-password regardless of email existence', async () => {
      const res = await api()
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost@school.com' });
      expect(res.status).toBe(204);
    });

    it('resets a password with a valid token', async () => {
      await api().post('/api/v1/auth/register').send(validRegister);
      await api().post('/api/v1/auth/forgot-password').send({ email: validRegister.email });
      const user = await User.findOne({ email: validRegister.email }).select('+resetToken');
      const res = await api().post('/api/v1/auth/reset-password').send({
        email: validRegister.email,
        token: user?.resetToken,
        password: 'NewPassword1',
      });
      expect(res.status).toBe(200);

      const login = await api()
        .post('/api/v1/auth/login')
        .send({ email: validRegister.email, password: 'NewPassword1' });
      expect(login.status).toBe(200);
    });
  });
});
