# Changelog

All notable changes to Homework Tracker for Praxi. Versions follow [semantic versioning](https://semver.org/): new features bump the middle number, fixes bump the last.

## [1.2.0] - 2026-11-22

### Added
- **🖨 Print list**: the grid as a one-page landscape checklist, shrinking to fit when needed. Shows only your student's items, with parent sign-off boxes, overdue items and teacher-change flags.
- **🖨 Print calendar**: a two-week Monday–Saturday wall calendar. Homework is orange, papers and presentations are green, tests and quizzes are marked 📝. A day that's too full says "+N more — see list printout".
- The version number now shows in the footer and links to this changelog.

## [1.1.0] - 2026-11-21

### Added
- A collapsible **About & how to use** intro: why the tracker exists, what it does and doesn't do, and how to use it (load the semester once, then paste weekly).
- The copy/paste steps now appear inside the paste box, with ⌘ on Mac and Ctrl+ on Windows.
- A **Raise an issue** button with reporting tips. It opens a prefilled GitHub issue for a problem or a feature request.
- Support for students with many classes: columns narrow to fit (8 classes fit a 1280px laptop), and the date column stays put when scrolling sideways.

### Fixed
- Classes whose teacher uses a title like Sra., Mme, Coach or Prof. no longer get merged into the class listed before them.

## [1.0.0] - 2026-11-21

First public release.

- Paste the Praxi Homework page to get every class in a grid by due date.
- Checkboxes that stick between visits, an overdue row with "mark all before a date done", and flags for teacher edits, moved due dates and tests or quizzes.
- **Settings**: the student's name (used to find their row in presentation sign-ups) and which classes need a parent signature.
- Saves in the browser, with optional backup and sync to a Google Drive, iCloud or OneDrive folder (Chrome/Edge).
- Works on Mac and Windows. Data from the original private version carries over automatically.

[1.2.0]: https://github.com/ricobert1/praxi-homework-tracker/releases/tag/v1.2.0
[1.1.0]: https://github.com/ricobert1/praxi-homework-tracker/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ricobert1/praxi-homework-tracker/commit/7d5b8b2
