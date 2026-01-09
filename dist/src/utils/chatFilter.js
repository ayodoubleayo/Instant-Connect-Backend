"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsBannedContent = void 0;
const bannedPatterns = [
    // 📞 Phone / contact
    /\b\d{8,14}\b/, // raw numbers
    /\b(digit|number|contact)\b/i,
    /\bcall\b/i,
    /\btext me\b/i,
    /\bwhatsapp\b/i,
    /\btelegram\b/i,
    /\binstagram\b/i,
    /\bdm me\b/i,
    // 📧 Email
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    // 📍 Address / location intent
    /\bi live\b/i,
    /\bi stay\b/i,
    /\bmy place\b/i,
    /\bmy house\b/i,
    /\baddress\b/i,
    /\bwhere you stay\b/i,
    // 🏠 Address structure (THIS FIXES "no 6", "house 10")
    /\bno\.?\s?\d+\b/i,
    /\bhouse\s?\d+\b/i,
    /\bflat\s?\d+\b/i,
    /\bstreet\b/i,
    /\broad\b/i,
    /\bavenue\b/i,
    /\bclose\b/i,
    // 🧭 Direction / movement intent
    /\bcome here\b/i,
    /\bcome ehre\b/i, // typo-safe
    /\bcome over\b/i,
    /\bmeet me\b/i,
    /\bmy area\b/i,
    /\bnear me\b/i,
    /\baround here\b/i,
    // 🤝 Meet intent (English + Pidgin)
    /\bmeet\b/i,
    /\blet us meet\b/i,
    /\bmake we meet\b/i,
    // 🇳🇬 Nigerian cities / states (COARSE, PAYWALL SAFE)
    /\blagos\b/i,
    /\blagos state\b/i,
    /\babuja\b/i,
    /\bibadan\b/i,
    /\bport harcourt\b/i,
    /\benugu\b/i,
    /\bowerri\b/i,
    /\baba\b/i,
    /\bonitsha\b/i,
    /\basaba\b/i,
    // 🇳🇬 Lagos areas
    /\bgbagada\b/i,
    /\bikorodu\b/i,
    /\blekki\b/i,
    /\byaba\b/i,
    /\bsurulere\b/i,
    /\bajah\b/i,
    /\bikoyi\b/i,
    /\bikeja\b/i,
];
const containsBannedContent = (text) => {
    return bannedPatterns.some((pattern) => pattern.test(text.toLowerCase()));
};
exports.containsBannedContent = containsBannedContent;
