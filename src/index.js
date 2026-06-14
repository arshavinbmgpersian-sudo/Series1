export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(check(env));
  },

  async fetch() {
    return new Response("Bot is running");
  }
};

let seen = new Set();

async function check(env) {
  const res = await fetch("https://subsource.net/series", {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await res.text();

  // گرفتن لینک + عنوان از صفحه
  const regex = /href="(\/series\/[^"]+)".*?title="([^"]+)"/g;

  let match;

  while ((match = regex.exec(html)) !== null) {
    const url = "https://subsource.net" + match[1];
    const title = match[2];

    const text = title.toLowerCase();

    // 1. فقط فارسی
    const isPersian = /[\u0600-\u06FF]/.test(title);
    if (!isPersian) continue;

    // 2. فقط سریال
    const isSeries =
      text.includes("season") ||
      text.includes("episode") ||
      text.includes("s0") ||
      text.includes("s1") ||
      text.includes("قسمت");

    if (!isSeries) continue;

    // 3. جلوگیری از تکرار (موقت)
    if (seen.has(url)) continue;
    seen.add(url);

    if (seen.size > 200) seen.clear();

    await sendTelegram(env, title, url);
  }
}

async function sendTelegram(env, title, url) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: env.CHAT_ID,
      text:
        `🎬 سریال جدید زیرنویس فارسی\n\n` +
        `📺 ${title}\n` +
        `🔗 ${url}`
    })
  });
      }
