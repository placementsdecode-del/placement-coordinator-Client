const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.CLIENT_URL || 'http://127.0.0.1:4177';
const skill = {
  key: 'coding', label: 'Coding', weight: 100, minimum: 7, mandatory: true, score: 0,
  recentSamples: 1, enough: false, recommendation: 'Complete 2 more distinct recent Coding evaluations.',
  difficulties: [],
};
const policy = { _id: 'default-policy', label: 'Developer', version: 1, skills: [skill], minSamples: 3 };
const activity = { assessmentsCompleted: 2, activeDays: 4, activeMinutes: 25, pendingReview: 0, problemsSolved: 1, problemsAttempted: 2, submissions: 2 };
const first = {
  student: { id: 'c1', name: 'Asha Rao', registrationNumber: 'CSE001', department: 'CSE', batch: '2026', section: { name: 'Section A' } },
  overall: 0, status: 'Not Ready', eligibility: { status: 'Not Eligible', reasons: ['Coding score is below the cutoff.'] },
  skills: [skill], activity,
};
const second = {
  ...first, student: { ...first.student, id: 'c2', name: 'Sam Das', registrationNumber: 'ECE002', department: 'ECE' },
  overall: null, status: 'Insufficient Evidence', skills: [{ ...skill, score: null, recentSamples: 0 }],
};

const attempt = {
  id: 'at1', ledgerId: 'ledger1', assessmentId: 'a2', attemptNumber: 1, title: 'Loops', skill: 'coding',
  difficulty: 'beginner', status: 'in-progress', startedAt: new Date().toISOString(), dueAt: new Date(Date.now() + 300000).toISOString(),
  score: null, totalMarks: 10, answers: [null],
  questions: [{ id: 'q1', type: 'single-choice', text: 'Choose a loop keyword', options: ['for', 'if'], marks: 10 }],
};

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/google-chrome-stable',
    headless: true, args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' || (message.type() === 'error' && !message.text().startsWith('Failed to load resource:'))) {
        runtimeErrors.push(message.text());
      }
    });
    let role = 'teacher';
    let failNext = false;
    const requests = [];
    let submitted = false;
    let releaseAutosave;
    const autosave = new Promise(resolve => { releaseAutosave = resolve; });
    await page.addInitScript(() => localStorage.setItem('accessToken', 'local-test-token'));
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      const q = url.searchParams;
      let status = 200;
      let body;
      if (url.pathname === '/api/auth/me') body = { user: { id: 'viewer', name: 'Viewer', role } };
      else if (url.pathname === '/api/readiness/students') {
        requests.push(Object.fromEntries(q));
        if (failNext) {
          failNext = false;
          status = 503;
          body = { message: 'Candidate service unavailable' };
        } else {
          const matches = [first, second].filter(row =>
            (!q.get('search') || row.student.registrationNumber.includes(q.get('search'))) &&
            (!q.get('department') || row.student.department === q.get('department')) &&
            (!q.get('skill') || (row.skills[0].score !== null && row.skills[0].score >= Number(q.get('minimum') || 0))));
          const counts = Object.fromEntries(matches.map(row => [row.status, 1]));
          const students = matches.filter(row => !q.get('readiness') || row.status === q.get('readiness'));
          const current = Math.min(Number(q.get('page') || 1), Math.max(students.length, 1));
          body = { policy, policies: [policy], page: current, pages: students.length, total: students.length,
            students: students.slice(current - 1, current), counts, departments: ['CSE', 'ECE'], batches: ['2026'] };
        }
      } else if (url.pathname === '/api/readiness/students/c2') body = {
        ...second, policy, daily: [], history: [], evidence: [], decisions: [], coverage: 0, evidenceCount: 0,
      };
      else if (url.pathname === '/api/readiness/leaderboard') body = {
        sections: [{ _id: 's1', name: 'Section A' }],
        rows: [{ id: 'c1', name: 'Asha Rao', department: 'CSE', batch: '2026', assessments: 2, score: 90 }],
      };
      else if (url.pathname === '/api/readiness/me') body = first;
      else if (url.pathname === '/api/readiness/assessments/a2/start') body = { attempt };
      else if (url.pathname === '/api/readiness/attempts/ledger1/at1/answers') {
        await autosave;
        body = { message: 'Answers saved' };
      } else if (url.pathname === '/api/readiness/attempts/ledger1/at1/submit') {
        submitted = true;
        body = { attempt: { ...attempt, status: 'graded', score: 10, answers: ['for'] } };
      } else if (url.pathname === '/api/readiness/assessments') {
        const currentAttempt = submitted ? { ...attempt, status: 'graded', score: 10, answers: ['for'] } : attempt;
        body = {
          assessments: [
            { _id: 'a1', title: 'Arrays', category: 'dsa', durationMinutes: 10, status: 'active', attemptsAllowed: 1, attempts: [] },
            { _id: 'a2', title: 'Loops', category: 'coding', durationMinutes: 15, status: 'active', attemptsAllowed: 1, attempts: [currentAttempt], instructions: 'Answer the question.', totalMarks: 10 },
          ],
          upcoming: [{ _id: 'a3', title: 'Trees', category: 'dsa', durationMinutes: 20 }],
          attempts: [currentAttempt],
        };
      }
      else if (url.pathname === '/api/community/work') body = { work: [{ _id: 'w1', kind: 'task', title: 'Write a résumé' }] };
      else if (url.pathname === '/api/community/section') body = { section: null };
      else if (url.pathname === '/api/community/notifications') body = { unreadCount: 0, notifications: [] };
      else {
        runtimeErrors.push(`Unexpected request to ${url.pathname}`);
        status = 404;
        body = { message: 'Unexpected request' };
      }
      await route.fulfill({ status, json: body });
    });

    await page.goto(base + '/teacher/readiness');
    const results = page.getByRole('region', { name: 'Candidate results' });
    await results.getByText('2 matching students · Page 1 of 2').waitFor();
    await results.getByText('0.0 / 10').first().waitFor();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await results.getByText('2 matching students · Page 2 of 2').waitFor();
    await results.getByText('Not evaluated').first().waitFor();
    await page.getByRole('button', { name: 'View details for Sam Das' }).click();
    await page.getByRole('heading', { name: 'Sam Das' }).waitFor();
    await page.getByRole('button', { name: 'Back to candidates' }).click();
    await results.getByText('2 matching students · Page 2 of 2').waitFor();

    const readyCard = page.getByRole('button', { name: /Not Ready$/, exact: false });
    await readyCard.click();
    await results.getByText('1 matching student · Page 1 of 1').waitFor();
    assert.equal(await readyCard.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('combobox', { name: 'Readiness', exact: true }).inputValue(), 'Not Ready');
    await page.getByRole('combobox', { name: 'Readiness', exact: true }).selectOption('Insufficient Evidence');
    assert.equal(await page.getByRole('button', { name: /Insufficient Evidence$/ }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Reset filters' }).click();

    await page.getByText('Advanced filters', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Skill', exact: true }).selectOption('coding');
    await page.getByLabel('Minimum score / 10').fill('0');
    await results.getByText('1 matching student · Page 1 of 1').waitFor();
    await page.waitForFunction(() => document.querySelector('input[type="number"]')?.value === '0');
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await results.getByText('2 matching students · Page 1 of 2').waitFor();

    failNext = true;
    const search = page.getByLabel('Search students');
    await search.fill('ECE');
    await page.getByRole('alert').getByText('Candidate service unavailable').waitFor();
    assert.equal(await search.inputValue(), 'ECE');
    await page.getByRole('button', { name: 'Try again' }).click();
    await results.getByText('1 matching student · Page 1 of 1').waitFor();
    assert.equal(requests.at(-1).search, 'ECE');
    await search.fill('none');
    await results.getByText('No students match these filters.').waitFor();
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await results.getByText('2 matching students · Page 1 of 2').waitFor();

    await page.getByRole('button', { name: 'Collapse navigation' }).click();
    await page.getByRole('button', { name: 'Expand navigation' }).waitFor();
    await page.getByLabel('Leaderboard scope').selectOption('s1');
    await page.getByRole('cell', { name: '90%' }).waitFor();
    for (const width of [390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const table = results.getByRole('table');
      assert.equal(await table.isVisible(), width >= 1280, `Results at ${width}px`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await results.evaluate(node => node.scrollWidth <= node.clientWidth + 1));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Show filters' }).click();
    await page.getByRole('combobox', { name: 'Readiness', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Hide filters' }).click();
    assert.equal(await page.getByRole('combobox', { name: 'Readiness', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('navigation', { name: 'Workspace navigation' }).getByRole('button', { name: 'Readiness' }).waitFor();
    await page.locator('aside').getByRole('button', { name: 'Close navigation' }).click();

    role = 'student';
    await page.goto(base + '/student');
    const resume = page.getByRole('button', { name: /Loops.*Resume/ });
    await resume.waitFor();
    await page.getByRole('region', { name: 'Upcoming assessments' }).getByRole('button', { name: /Trees/ }).waitFor();
    await page.getByText('Complete 2 more distinct recent Coding evaluations.').waitFor();
    await page.getByText('1 pending · 0 submitted').waitFor();
    await page.getByRole('button', { name: /Write a résumé/ }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await resume.click();
    await page.getByRole('button', { name: 'Resume attempt' }).click();
    const saveRequest = page.waitForRequest(request => request.url().endsWith('/at1/answers'));
    await page.getByRole('radio', { name: 'for', exact: true }).check();
    await saveRequest;
    await page.getByRole('button', { name: 'Submit assessment' }).click();
    await page.getByText('Score 10/10', { exact: true }).waitFor();
    const saved = page.waitForResponse(response => response.url().endsWith('/at1/answers'));
    releaseAutosave();
    await saved;
    await page.getByRole('status').getByText('Submitted', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back to assessments' }).click();
    await page.getByText(/Attempt 1 · graded · 10\/10/).waitFor();
    assert.deepEqual(runtimeErrors, []);
    console.log('PASS: readiness filters, pagination, detail return, failed read and retry, leaderboard, responsive layouts, student overview, and grading during an in-flight autosave.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
