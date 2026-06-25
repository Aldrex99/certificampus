/**
 * Lightweight puppeteer mock for tests.
 *
 * test, so we stub the minimal surface used by src/utils/pdf.ts.
 */
const page = {
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from("")),
  close: jest.fn().mockResolvedValue(undefined),
};

const browser = {
  newPage: jest.fn().mockResolvedValue(page),
  close: jest.fn().mockResolvedValue(undefined),
};

const puppeteer = {
  launch: jest.fn().mockResolvedValue(browser),
};

export default puppeteer;
