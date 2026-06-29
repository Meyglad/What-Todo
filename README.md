# Todo App

A modern Todo application built with HTML, CSS and JavaScript.

## Features

* Add tasks
* Edit tasks
* Delete tasks
* Priority system
* Notes
* Search
* Sort
* Dark mode
* Offline support (PWA)

## Version

v1.0.0

## Release Workflow

To publish a new app version consistently, run:

```bash
node scripts/release.js patch "بهبود سرعت|رفع باگ جستجو"
```

Supported bump types:

* `patch`
* `minor`
* `major`

What this command updates automatically:

* `js/version.js` (`APP_VERSION` and `LAST_UPDATE`)
* `service-worker.js` (`CACHE_NAME`)
* `js/changelog.js` (new entry at top)

Change notes are separated by `|`.
