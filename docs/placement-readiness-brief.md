# Implementation brief: placement progress and readiness

Build an evidence-based Student Placement Progress and Readiness platform. Its core purpose is to show how students develop, identify skill gaps, and help coordinators shortlist candidates for job roles. Sections, groups, and notifications support this objective.

## Track reliable evidence

Record active learning time (excluding idle/background time), learning sessions and consistency, unique problems attempted/solved, accuracy, difficulty, test cases passed, submissions, assessment attendance/completion, all attempt scores, and time per attempt. Distinguish first attempts, retries, self-reported activity, and verified evaluations. Preserve historical evidence; do not infer ability from time spent or platform activity alone.

## Evaluate skills

Support configurable categories/subskills: aptitude, coding, DSA, problem solving, logical reasoning, critical thinking, SQL, technical fundamentals, communication, and interviews. Coordinators configure assessments, difficulty, marks, pass thresholds, duration, attempts, and audiences. Use explicit rubrics for interviews, communication, critical thinking, and faculty evaluations.

## Explain readiness

Show overall and per-skill readiness on a 0–10 scale, backed by normalized scores. Make weights and thresholds configurable by target role. Consider recent demonstrated performance, difficulty, consistency, improvement, and evidence coverage. Correctness/skill mastery outweigh speed or attendance. Show sample size, assessment dates, and evidence confidence; insufficient evidence is not a zero score. High performance in one area must not compensate for failing mandatory skill thresholds.

Version scoring rules and retain reproducible score history. Show the contribution and reason behind each score/status. Use Placement Ready, Almost Ready, Needs Improvement, Not Ready, and Insufficient Evidence; expose mandatory skill gaps separately. Validate scoring rules before treating them as reliable placement indicators.

## Provide actionable analytics

Support 3-, 4-, and 6-month windows plus custom ranges. Show skill trends, recent versus historical performance, learning consistency, active time, problem/assessment totals, strengths, gaps, and next recommended practice. Compare equivalent assessments and disclose changes in difficulty or evidence volume. Students see their progress and next steps; teachers see students needing support and section/cohort summaries.

## Enable accountable shortlisting

Filter by role/company, skill minimums, readiness, recent consistency, evidence recency, department, batch, graduation year, CGPA, and backlogs where required. Show Eligible, Nearly Eligible, and Not Eligible with specific reasons. Keep system recommendations separate from coordinator decisions: Shortlisted, Hold, Needs Training, or Not Eligible. Log overrides and reasons. Preserve accessible evaluation options; avoid treating device availability, raw hours, or speed as substitutes for ability.

Prepare consent-based, permission-scoped HR access to longitudinal profiles and supporting evidence. HR access, exports, and shortlist decisions must be auditable. Do not expose private student information by default or automate final hiring decisions.

## Delivery order

Audit existing data and missing evidence first. Then implement reliable activity/attempt capture, scoring rules and tests, student/coordinator dashboards, and company-specific shortlisting. Integrate external HR access later. Use the shared API client and domain services; include loading/error/empty states and test calculations, permissions, retries, and historical reproducibility. Do not fabricate analytics when source data is missing.
