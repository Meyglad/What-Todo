#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const versionPath = path.join(root, "js", "version.js");
const swPath = path.join(root, "service-worker.js");
const changelogPath = path.join(root, "js", "changelog.js");

const bumpType = (process.argv[2] || "patch").toLowerCase();
const changesArg = process.argv.slice(3).join(" ").trim();

function failWithGuide(message) {
  console.error(`خطا: ${message}`);
  console.error("نمونه صحیح:");
  console.error('node scripts/release.js patch "بهبود سرعت|رفع باگ جستجو"');
  process.exit(1);
}

if (!["patch", "minor", "major"].includes(bumpType)) {
  failWithGuide("نوع نسخه نامعتبر است. فقط patch | minor | major مجاز است.");
}

if (!changesArg) {
  failWithGuide("لطفا حداقل یک مورد تغییر وارد کن.");
}

function sanitizeChangeText(text) {
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[<>`]/g, "")
    .trim();
}

const changes = changesArg
  .split("|")
  .map(item => sanitizeChangeText(item))
  .filter(Boolean)
  .filter((item, index, arr) => arr.indexOf(item) === index);

if (!changes.length) {
  failWithGuide("متن تغییرات پس از پاکسازی خالی شد یا معتبر نیست.");
}

if (changes.some(item => item.length < 3)) {
  failWithGuide("هر مورد تغییر باید حداقل ۳ کاراکتر باشد.");
}

if (changes.some(item => item.length > 140)) {
  failWithGuide("هر مورد تغییر باید حداکثر ۱۴۰ کاراکتر باشد.");
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function bumpVersion(version, type) {
  const parts = version.split(".").map(n => Number(n));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`فرمت نسخه نامعتبر است: ${version}`);
  }

  let [major, minor, patch] = parts;

  if (type === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function getTodayJalali() {
  const formatted = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  // Normalize Persian digits to ASCII digits.
  const digitMap = {
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9"
  };

  return formatted
    .replace(/[۰-۹]/g, d => digitMap[d])
    .replace(/[.]/g, "/");
}

const versionText = read(versionPath);
const swText = read(swPath);
const changelogText = read(changelogPath);

const versionMatch = versionText.match(/APP_VERSION\s*=\s*"([^"]+)"/);
if (!versionMatch) {
  throw new Error("APP_VERSION در version.js پیدا نشد.");
}

const currentVersion = versionMatch[1];
if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
  throw new Error(`فرمت APP_VERSION نامعتبر است: ${currentVersion}`);
}

const nextVersion = bumpVersion(currentVersion, bumpType);
const today = getTodayJalali();

const updatedVersionText = versionText
  .replace(/APP_VERSION\s*=\s*"[^"]+"/, `APP_VERSION = "${nextVersion}"`)
  .replace(/LAST_UPDATE\s*=\s*"[^"]+"/, `LAST_UPDATE = "${today}"`);

const updatedSwText = swText.replace(
  /const CACHE_NAME\s*=\s*"[^"]+";/,
  `const CACHE_NAME = "${nextVersion}";`
);

const entryLines = [
  `  "${nextVersion}": {`,
  `    date: "${today}",`,
  "    changes: [",
  ...changes.map(change => `      "${change.replace(/"/g, '\\"')}",`),
  "    ]",
  "  },"
].join("\n");

if (changelogText.includes(`\"${nextVersion}\"`)) {
  throw new Error(`نسخه ${nextVersion} از قبل در changelog ثبت شده است.`);
}

const updatedChangelogText = changelogText.replace(
  /(const\s+CHANGELOG\s*=\s*\{\r?\n)/,
  `$1${entryLines}\n`
);

if (updatedChangelogText === changelogText) {
  throw new Error("ساختار CHANGELOG در changelog.js قابل تشخیص نیست.");
}

write(versionPath, updatedVersionText);
write(swPath, updatedSwText);
write(changelogPath, updatedChangelogText);

console.log("--- انتشار جدید ثبت شد ---");
console.log(`نسخه قبلی: ${currentVersion}`);
console.log(`نسخه جدید: ${nextVersion}`);
console.log(`تاریخ: ${today}`);
console.log(`تغییرات: ${changes.length} مورد`);
console.log("فایل‌های آپدیت‌شده:");
console.log("- js/version.js");
console.log("- service-worker.js");
console.log("- js/changelog.js");
