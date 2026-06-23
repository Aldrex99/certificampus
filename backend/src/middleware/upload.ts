import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const EXCEL_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

/** In-memory upload limited to a single Excel file (max 5 MB). */
export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (EXCEL_MIME.includes(file.mimetype) || /\.(xlsx|xls)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés'));
    }
  },
}).single('file');
