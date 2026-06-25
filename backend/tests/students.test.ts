import * as XLSX from 'xlsx';
import { api, auth, createSchoolContext, SchoolContext } from './helpers';
import { Student } from '../src/models';

function makeWorkbook(rows: Record<string, unknown>[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'students');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('Students feature', () => {
  let ctx: SchoolContext;
  beforeEach(async () => {
    ctx = await createSchoolContext();
  });

  it('rejects unauthenticated access with 401', async () => {
    const res = await api().get('/api/v1/students');
    expect(res.status).toBe(401);
  });

  it('creates and lists students', async () => {
    const create = await api()
      .post('/api/v1/students')
      .set('Authorization', auth(ctx.token))
      .send({ firstname: 'Ada', lastname: 'Lovelace', email: 'ada@s.com', status: 'admis' });
    expect(create.status).toBe(201);

    const list = await api().get('/api/v1/students').set('Authorization', auth(ctx.token));
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(1);
    expect(list.body.data.items[0].email).toBe('ada@s.com');
  });

  it('updates a student', async () => {
    const student = await Student.create({
      firstname: 'Tim',
      lastname: 'Berners',
      email: 'tim@s.com',
      school: ctx.schoolId,
      status: 'ajourne',
    });
    const res = await api()
      .put(`/api/v1/students/${student._id}`)
      .set('Authorization', auth(ctx.token))
      .send({ status: 'admis', grade: 'Bien' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('admis');
  });

  it('deletes a student (204) and bulk-deletes', async () => {
    const s1 = await Student.create({
      firstname: 'A', lastname: 'B', email: 'a@s.com', school: ctx.schoolId,
    });
    const s2 = await Student.create({
      firstname: 'C', lastname: 'D', email: 'c@s.com', school: ctx.schoolId,
    });
    const del = await api()
      .delete(`/api/v1/students/${s1._id}`)
      .set('Authorization', auth(ctx.token));
    expect(del.status).toBe(204);

    const bulk = await api()
      .post('/api/v1/students/bulk-delete')
      .set('Authorization', auth(ctx.token))
      .send({ ids: [String(s2._id)] });
    expect(bulk.status).toBe(200);
    expect(bulk.body.data.deleted).toBe(1);
    expect(await Student.countDocuments({ school: ctx.schoolId })).toBe(0);
  });

  it('does not leak students from another school', async () => {
    const other = await createSchoolContext('other@example.com');
    await Student.create({
      firstname: 'X', lastname: 'Y', email: 'x@s.com', school: other.schoolId,
    });
    const list = await api().get('/api/v1/students').set('Authorization', auth(ctx.token));
    expect(list.body.data.total).toBe(0);
  });

  it('imports students from an Excel file', async () => {
    const buffer = makeWorkbook([
      { firstname: 'Jean', lastname: 'Valjean', email: 'jean@s.com', status: 'admis', formation: 'Master' },
      { firstname: 'Cosette', lastname: 'Fauchelevent', email: 'cosette@s.com', statut: 'ajourné' },
    ]);
    const res = await api()
      .post('/api/v1/students/import')
      .set('Authorization', auth(ctx.token))
      .attach('file', buffer, 'students.xlsx');

    expect(res.status).toBe(201);
    expect(res.body.data.created).toBe(2);
    expect(await Student.countDocuments({ school: ctx.schoolId })).toBe(2);
    const admis = await Student.findOne({ email: 'jean@s.com' });
    expect(admis?.status).toBe('admis');
    expect(admis?.training).toBeDefined();
  });

  it('downloads an Excel template', async () => {
    const res = await api()
      .get('/api/v1/students/template')
      .set('Authorization', auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
  });
});
