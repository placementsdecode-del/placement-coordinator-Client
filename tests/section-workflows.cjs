// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const sections = [{ _id: 's1', name: 'Section A', code: 'CSE-A', department: 'CSE', batch: '2026', academicYear: '2026–2027', assignedTeachers: [], status: 'active', description: 'Final year placement preparation' }, { _id: 's2', name: 'Section A', code: 'ECE-A', department: 'ECE', batch: '2026', academicYear: '2026–2027', assignedTeachers: [], status: 'active', description: 'Electronics placement preparation' }];
    const users = [{ id: 'u1', name: 'Asha Rao', email: 'asha@example.test', registrationNumber: 'CSE001', role: 'student', status: 'active', section: null }];
    const calls = []; let failCreate = false;
    await page.addInitScript(() => localStorage.setItem('accessToken', 'local-test-token'));
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname; const method = req.method(); calls.push({ path, method });
      let body = {}; let status = 200;
      if (path.endsWith('/auth/me')) { await new Promise(resolve => setTimeout(resolve, 200)); body = { user: { id: 'admin', name: 'Admin', role: 'admin', organization: 'org-a' } }; }
      else if (path === '/api/users') body = { users };
      else if (path === '/api/roles') body = { roles: [] };
      else if (path === '/api/roles/permissions') body = { permissions: [] };
      else if (path === '/api/assessments') body = { assessments: [] };
      else if (path === '/api/sections' && method === 'GET') body = { sections };
      else if (path === '/api/sections' && method === 'POST') {
        if (failCreate) { status = 400; body = { message: 'Section code already exists' }; }
        else { const section = { ...req.postDataJSON(), _id: 's3', assignedTeachers: [] }; assert.ok(section.academicYear); sections.push(section); body = { section, message: 'Section created' }; }
      } else if (/\/sections\/s\d\/students\/u1/.test(path)) {
        users[0].section = method === 'DELETE' ? null : path.split('/')[3]; body = { message: 'Saved' };
      } else if (method === 'PATCH') {
        const section = sections.find(s => path.endsWith('/' + s._id)); Object.assign(section, req.postDataJSON()); body = { section };
      } else throw new Error(`Unexpected request: ${method} ${path}`);
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto('http://127.0.0.1:5173/admin/sections');
    await page.getByLabel('Restoring your session').waitFor();
    await page.getByRole('heading', { name: 'Sections', exact: true, level: 1 }).waitFor();
    await page.getByLabel('Assign an existing student').selectOption('u1');
    await page.getByRole('button', { name: 'Assign student', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Student section"]')?.value === 's1');
    await page.getByLabel('Student section', { exact: true }).selectOption('s2');
    await page.waitForFunction(() => document.querySelector('[aria-label="Student section"]')?.value === 's2');
    await page.getByLabel('Student section', { exact: true }).selectOption('');
    await page.waitForFunction(() => document.querySelector('[aria-label="Student section"]')?.value === '');
    assert.ok(calls.some(c => c.method === 'DELETE' && c.path === '/api/sections/s2/students/u1'));
    await page.getByRole('button', { name: 'Edit section', exact: true }).click();
    await page.getByLabel('Section name', { exact: true }).fill('Final year CSE');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await page.getByRole('heading', { name: 'Final year CSE', exact: true }).waitFor();
    await page.getByRole('button', { name: 'New Section' }).click();
    await page.getByLabel('Section name', { exact: true }).fill('New section');
    await page.getByLabel('Section code', { exact: true }).fill('NEW');
    await page.getByLabel('Department', { exact: true }).fill('CSE');
    await page.getByLabel('Batch', { exact: true }).fill('2027');
    await page.getByLabel('Academic year *', { exact: true }).fill('2026–2027');
    failCreate = true;
    await page.getByRole('button', { name: 'Create section', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Section code already exists' }).waitFor();
    assert.equal(await page.getByLabel('Section name', { exact: true }).inputValue(), 'New section');
    failCreate = false;
    await page.getByRole('button', { name: 'Create section', exact: true }).click();
    await page.getByRole('heading', { name: 'New section', exact: true }).waitFor();
    await page.screenshot({ path: '/tmp/placement-sections-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/placement-sections-mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Students', exact: true }).click();
    await page.getByLabel('Filter by section').selectOption('unassigned');
    await page.getByRole('button').filter({ hasText: 'Asha Rao' }).waitFor();
    await page.getByLabel('Search students').fill('no match');
    await page.getByText('No matching students', { exact: true }).waitFor();
    for (const nav of ['Dashboard', 'Coordinators', 'Groups', 'Tasks', 'Assessments', 'Announcements', 'Reports', 'Settings']) {
      await page.getByRole('button', { name: nav, exact: true }).first().click();
      await page.locator('h1').waitFor();
    }
    await page.route('**/api/users?**', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Unavailable' }) }));
    await page.reload();
    await page.getByRole('button', { name: 'Try again' }).waitFor();
    await page.unroute('**/api/users?**');
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.locator('h1').waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: session skeleton; assign, move between same-name sections, remove, edit, create, failed-save preservation; mobile overflow; no browser errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
