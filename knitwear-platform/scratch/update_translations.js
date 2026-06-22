const fs = require('fs');
const path = require('path');

const koPath = path.join(__dirname, '../src/i18n/messages/ko.json');
const enPath = path.join(__dirname, '../src/i18n/messages/en.json');

try {
    const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    // Inject threshold translation keys
    ko.ai.imageToChart.removeBgThreshold = "배경 제거 범위 (허용치)";
    en.ai.imageToChart.removeBgThreshold = "Background Removal Tolerance";

    fs.writeFileSync(koPath, JSON.stringify(ko, null, 2), 'utf8');
    fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

    console.log("Translations updated successfully!");
} catch (e) {
    console.error("Error updating translations:", e);
}
