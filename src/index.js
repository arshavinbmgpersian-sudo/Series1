async function sendMenu(chatId, env) {

  const keyboard = {
    keyboard: [
      ["🆕 تازه‌ها"],
      ["🔥 آخرین آپدیت‌ها", "📈 پربازدیدترین‌ها"],
      ["🔍 جستجو"],
      ["❤️ علاقه‌مندی‌ها", "📅 جدول پخش"],
      ["💬 پشتیبانی"]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "🎬 وارد ربات شدی، از منو استفاده کن 👇",
      reply_markup: keyboard
    })
  });
}
