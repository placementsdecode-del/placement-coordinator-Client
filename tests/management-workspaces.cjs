const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.CLIENT_URL || 'http://127.0.0.1:4177';
const auditRoutes = {
  admin: ['Dashboard', 'Readiness', 'Students', 'Cohorts', 'Groups', 'Tasks', 'Assessments', 'Coordinators', 'Settings'],
  'super-admin': ['Dashboard', 'Organizations', 'Requests', 'Users', 'Features', 'Plans', 'Analytics', 'Support', 'Audit Logs', 'Changelog', 'Settings'],
};
const routeFor = (role, label) => `/${role}${label === 'Dashboard' ? '' : '/' + label.toLowerCase().replaceAll(' ', '-')}`;
const feature = { _id: 'feature-1', key: 'analytics', name: 'Analytics reports', description: 'Organization analytics and reporting.', enabledByDefault: true, isActive: true };
const organization = {
  _id: 'org-1', registrationRequest: 'request-1', orgName: 'North Valley Institute of Engineering and Applied Technology',
  orgEmail: 'north-valley-institutional-administration@example.test', address: 'Student Services Building, North Valley',
  phoneNumber: '9000000000', location: { city: 'North Valley' }, status: 'active', features: [feature],
  memberCounts: { students: 1, coordinators: 1, active: 3, total: 3 }, credentialsSentAt: '2026-01-01',
};
const pending = {
  ...organization, _id: 'request-2', orgName: 'Institute of Science and Applied Technology',
  requestedFeatures: [feature], status: 'pending',
};
const teacher = { id: 'teacher-1', name: 'Kavya Iyer', role: 'teacher', status: 'active', email: 'kavya@example.test', organization };
const cohort = {
  _id: 'cohort-1', name: 'Final year engineering', code: 'CSE-26', department: 'CSE', batch: '2026', academicYear: '2025–26',
  assignedTeachers: [teacher], status: 'active', description: 'Preparation cohort for final-year engineering students.', organization: organization._id,
};
const student = {
  id: 'student-1', registrationNumber: 'CSE001', name: 'Sanvi Rao', email: 'student-with-an-unusually-long-account-name@example.test',
  role: 'student', status: 'active', organization, section: cohort, department: 'CSE', batch: '2026',
};
const assessment = {
  _id: 'assessment-1', title: 'Coding fundamentals', status: 'active', category: 'Coding',
  assignedSections: [cohort], durationMinutes: 30, totalMarks: 10, passingMarks: 5, questions: [],
  instructions: 'Answer each question.', assignedGroups: [],
};
const policy = { _id: 'policy-1', label: 'Developer', version: 1, skills: [], minSamples: 3 };
const report = {
  student: { ...student, section: { name: cohort.name } }, overall: null, status: 'Insufficient Evidence',
  policy, skills: [], coverage: 0, evidenceCount: 0, eligibility: { status: 'Not Eligible', reasons: [] },
  activity: { activeMinutes: 0, activeDays: 0, problemsAttempted: 0, problemsSolved: 0, submissions: 0, assessmentsCompleted: 0, pendingReview: 0 },
  daily: [], history: [], evidence: [], decisions: [],
};
const group = {
  _id: 'group-1', name: 'Interview practice group', description: 'Peer discussion and interview preparation',
  createdBy: teacher, coordinators: [], participants: [{ student, status: 'accepted' }],
};
const work = { _id: 'work-1', title: 'Prepare a résumé', status: 'published', kind: 'homework', instructions: 'Write a résumé.', assignedSections: [cohort] };
const role = { _id: 'role-1', name: 'teacher', displayName: 'Coordinator', permissions: ['assessment.manage'], isEditable: true, organization };

async function mockWorkspace(page, workspace, errors) {
  let empty = false;
  let failReadiness = false;
  let failOrganizations = false;
  await page.addInitScript(() => localStorage.setItem('accessToken', 'management-ui-test'));
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'warning' || (message.type() === 'error' && !message.text().startsWith('Failed to load resource:'))) errors.push(message.text());
  });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const rows = (...items) => empty ? [] : items;
    const data = {
      '/api/auth/me': { user: { id: workspace, role: workspace === 'admin' ? 'admin' : 'superadmin', name: 'Test operator', organization: organization._id } },
      '/api/organizations': { organizations: rows(organization) },
      '/api/org-registrations': { registrations: rows(pending) },
      '/api/users': { users: rows(student, teacher) },
      '/api/roles': { roles: rows(role) },
      '/api/roles/permissions': { permissions: ['assessment.manage', 'user.manage'] },
      '/api/features': { features: rows(feature) },
      '/api/sections': { sections: rows(cohort) },
      '/api/assessments': { assessments: rows(assessment) },
      '/api/groups/coordinators': { faculty: rows(teacher) },
      '/api/groups': { groups: rows(group) },
      '/api/groups/group-1/messages': { messages: [], hasMore: false },
      '/api/work': { work: rows(work) },
      '/api/work/work-1/submissions': { submissions: [] },
      '/api/readiness/students': { policy, policies: [policy], students: rows(report), counts: empty ? {} : { 'Insufficient Evidence': 1 },
        departments: rows('CSE'), batches: rows('2026'), page: 1, pages: empty ? 0 : 1, total: empty ? 0 : 1 },
      '/api/readiness/students/student-1': report,
      '/api/readiness/leaderboard': { sections: rows(cohort), rows: [] },
      '/api/readiness/assessments/assessment-1/reviews': { attempts: [], roster: [] },
    };
    if (path === '/api/readiness/students' && failReadiness) return route.fulfill({ status: 503, json: { message: 'Candidate service unavailable' } });
    if (path === '/api/organizations' && failOrganizations) return route.fulfill({ status: 503, json: { message: 'Organization service unavailable' } });
    if (!(path in data)) errors.push(`Unexpected API request to ${path}`);
    await route.fulfill({ status: path in data ? 200 : 404, json: data[path] ?? {} });
  });
  return { setEmpty: value => { empty = value; }, setFailReadiness: value => { failReadiness = value; }, setFailOrganizations: value => { failOrganizations = value; } };
}

async function checkLayout(page, route, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForFunction(expectedLeft =>
    Math.abs(document.querySelector('.management-workspace header').getBoundingClientRect().left - expectedLeft) < 0.5,
    width >= 1024 ? 256 : 0);
  const layout = await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const main = document.querySelector('main');
    const header = document.querySelector('.management-workspace header');
    const sidebar = document.querySelector('#workspace-sidebar');
    const selectSizes = [...main.querySelectorAll('select.compact-select')].filter(node => node.checkVisibility()).map(node => ({ name: node.getAttribute('aria-label') ?? node.parentElement.querySelector('label')?.textContent, height: Math.round(node.getBoundingClientRect().height), css: getComputedStyle(node).height }));
    return {
      viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
      flowWidth: main.scrollWidth, mainWidth: main.clientWidth,
      headerHeight: header.getBoundingClientRect().height, headerLeft: header.getBoundingClientRect().left,
      sidebarWidth: sidebar.getBoundingClientRect().width, selectSizes,
    };
  });
  assert.ok(layout.documentWidth <= layout.viewport, `${route} overflows viewport at ${width}px`);
  assert.ok(layout.flowWidth <= layout.mainWidth + 1, `${route} overflows content at ${width}px: ${layout.flowWidth} > ${layout.mainWidth}`);
  assert.equal(layout.headerHeight, 64, `${route} header height`);
  assert.equal(layout.headerLeft, width >= 1024 ? 256 : 0, `${route} header alignment`);
  assert.equal(layout.sidebarWidth, 256, `${route} sidebar width`);
  assert.ok(layout.selectSizes.every(size => size.height === (width >= 640 ? 40 : 44)), `${route} select sizing at ${width}px: ${JSON.stringify(layout.selectSizes)}`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome-stable',
    headless: true, args: ['--no-sandbox'],
  });
  try {
    for (const [workspace, labels] of Object.entries(auditRoutes)) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      page.setDefaultTimeout(10000);
      const errors = [];
      const fixture = await mockWorkspace(page, workspace, errors);
      await page.goto(base + routeFor(workspace, 'Dashboard'));
      const nav = page.getByRole('navigation', { name: 'Workspace navigation' });
      await nav.getByRole('button', { name: 'Dashboard' }).waitFor();
      assert.deepEqual((await nav.getByRole('button').allTextContents()).map(label => label.trim()).sort(), [...labels].sort());
      for (const label of labels) {
        await page.setViewportSize({ width: 1440, height: 900 });
        await nav.getByRole('button', { name: label, exact: true }).click();
        const route = routeFor(workspace, label);
        await page.waitForURL(url => url.pathname === route);
        const main = page.getByRole('main');
        await main.getByRole('heading', { level: 1 }).waitFor();
        await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'));
        assert.equal(await main.getByRole('heading', { level: 1 }).count(), 1, route);
        assert.equal(await nav.getByRole('button', { name: label, exact: true }).getAttribute('aria-current'), 'page', route);
        await main.getByRole('navigation', { name: 'Breadcrumb' }).first().locator('[aria-current="page"]').getByText(label, { exact: true }).waitFor();
        for (const width of [390, 768, 1024, 1920]) await checkLayout(page, route, width);
        console.log(`PASS ${route}`);
      }

      await page.getByRole('button', { name: 'Collapse navigation' }).click();
      await page.getByRole('button', { name: 'Expand navigation' }).waitFor();
      await page.waitForFunction(() => document.querySelector('#workspace-sidebar').getBoundingClientRect().width === 80);
      await page.getByRole('button', { name: 'Expand navigation' }).click();
      await page.setViewportSize({ width: 390, height: 900 });
      const trigger = page.getByRole('button', { name: 'Open navigation' });
      await trigger.click();
      await page.getByRole('button', { name: 'Close navigation' }).waitFor();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === 'Close navigation');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement.getAttribute('aria-label') === 'Open navigation');
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

      if (workspace === 'admin') {
        await page.goto(base + '/admin/students');
        await page.getByRole('button', { name: /Sanvi Rao/ }).click();
        await page.getByRole('region', { name: 'Preparation snapshot' }).waitFor();
        await checkLayout(page, '/admin/students profile', 390);
        await page.goto(base + '/admin/cohorts');
        await page.getByRole('button', { name: /Final year engineering/ }).click();
        await page.getByRole('button', { name: 'Edit cohort' }).click();
        await checkLayout(page, '/admin/cohorts edit', 390);
        await page.goto(base + '/admin/groups');
        await page.getByRole('button', { name: /Interview practice group/ }).click();
        await page.getByRole('heading', { name: 'Interview practice group' }).waitFor();
        await checkLayout(page, '/admin/groups room', 390);
        await page.goto(base + '/admin/assessments');
        await page.getByRole('button', { name: 'Coding fundamentals', exact: true }).click();
        await page.getByText(/Student submissions/).waitFor();
        await checkLayout(page, '/admin/assessments review', 390);
        fixture.setFailReadiness(true);
        await page.goto(base + '/admin/readiness');
        await page.getByText('Candidate service unavailable').waitFor();
        fixture.setFailReadiness(false);
        await page.getByRole('button', { name: 'Try again' }).click();
        await page.getByRole('button', { name: 'View details for Sanvi Rao' }).waitFor();
        fixture.setEmpty(true);
        await page.goto(base + '/admin/groups');
        await page.getByText('No groups yet').waitFor();
        await page.goto(base + '/admin/tasks');
        await page.getByText('No assignments yet').waitFor();
        await page.goto(base + '/admin/cohorts');
        await page.getByText('No cohorts yet').waitFor();
      } else {
        await page.goto(base + '/super-admin/organizations');
        await page.getByRole('button', { name: 'Contact details' }).click();
        await page.getByLabel('Address', { exact: true }).waitFor();
        await checkLayout(page, '/super-admin/organizations contact', 390);
        await page.getByRole('navigation', { name: 'Organization sections' }).getByRole('button', { name: 'Features (1)', exact: true }).click();
        await page.getByRole('checkbox', { name: 'Analytics reports', exact: true }).waitFor();
        await checkLayout(page, '/super-admin/organizations features', 390);
        await page.goto(base + '/super-admin/changelog');
        await page.getByRole('main').getByRole('button').filter({ has: page.locator('code') }).first().click();
        await page.getByRole('heading', { name: 'Files in this deploy' }).waitFor();
        await checkLayout(page, '/super-admin/changelog detail', 390);
        fixture.setFailOrganizations(true);
        await page.goto(base + '/super-admin/organizations');
        await page.getByText('Organization service unavailable').waitFor();
        fixture.setFailOrganizations(false);
        await page.getByRole('button', { name: 'Try again' }).click();
        await page.getByRole('heading', { name: 'Organization directory' }).waitFor();
        fixture.setEmpty(true);
        await page.goto(base + '/super-admin/organizations');
        await page.getByText('No organizations yet').waitFor();
        await page.goto(base + '/super-admin/requests');
        await page.getByText('No organization requests').waitFor();
        await page.goto(base + '/super-admin/users');
        await page.getByText('No users yet').waitFor();
      }
      assert.deepEqual(errors, [], `Browser errors for ${workspace}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
