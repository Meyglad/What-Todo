const CHANGELOG = {
  "1.0.17": {
    date: "1405/04/08",
    changes: [
      "تست اسکریپت نسخه‌بندی",
      "اعتبارسنجی sanitize ورودی",
    ]
  },
  "1.0.16": {
    date: "1405/04/08",
    changes: [
      "پیاده‌سازی کش سه‌حالته در سرویس‌ورکر برای پایداری بیشتر",
      "بهینه‌سازی چک آپدیت به هر ۵ دقیقه و هنگام فوکوس تب",
      "بهبود fallback متن What's New و تعریف صریح updateOverlay",
      "سخت‌گیری بیشتر sanitize و پیام راهنمای بهتر در اسکریپت ریلیز"
    ]
  },
  "1.0.15": {
    date: "1405/04/07",
    changes: [
      "بهبود تجربه مودال آپدیت",
      "تکمیل چرخه نسخه‌بندی خودکار",
    ]
  },
  "1.0.14": {
    date: "1405/04/07",
    changes: [
      "افزودن سیستم نمایش تغییرات نسخه (What's New)",
      "اضافه شدن دکمه مشاهده تغییرات در مودال بروزرسانی",
      "بهبود جریان اعلان نسخه جدید و نسخه فعال‌شده"
    ]
  },
  "1.0.13": {
    date: "1405/04/07",
    changes: [
      "بهبود پایداری سرویس‌ورکر و تشخیص نسخه جدید",
      "نمایش پیام موفقیت پس از فعال شدن نسخه جدید",
      "هماهنگ‌سازی نسخه اپ و کش برای بروزرسانی قابل اتکا"
    ]
  }
};

function toComparable(version) {
  return version
    .split(".")
    .map(part => Number(part) || 0);
}

function compareVersions(a, b) {
  const pa = toComparable(a);
  const pb = toComparable(b);
  const max = Math.max(pa.length, pb.length);

  for (let i = 0; i < max; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;

    if (va > vb) return 1;
    if (va < vb) return -1;
  }

  return 0;
}

function getLatestChanges(version) {
  return CHANGELOG[version]?.changes || [];
}

function getChangesSince(previousVersion, currentVersion) {
  const versions = Object.keys(CHANGELOG)
    .sort((a, b) => compareVersions(b, a));

  const collected = [];

  versions.forEach(version => {
    if (compareVersions(version, currentVersion) > 0) {
      return;
    }

    if (previousVersion && compareVersions(version, previousVersion) <= 0) {
      return;
    }

    const entry = CHANGELOG[version];
    if (entry?.changes?.length) {
      collected.push(...entry.changes.map(change => `(${version}) ${change}`));
    }
  });

  return collected;
}

export {
  CHANGELOG,
  getLatestChanges,
  getChangesSince
};
