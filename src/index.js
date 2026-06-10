export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Bot is running");
    }

    const update = await request.json();

    // =====================
    // MESSAGE HANDLER
    // =====================
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      // /start => send menu
      if (text === "/start") {
        return sendMenu(chatId, env);
      }

      // /admin
      if (text === "/admin") {
        if (chatId == 5469103272) {
          return sendMessage(chatId, "⚙️ پنل مدیریت\n(در نسخه بعد کامل می‌شود)", env);
        } else {
          return sendMessage(chatId, "⛔ دسترسی ندارید", env);
        }
      }

      return sendMessage(chatId, "از منو استفاده کنید 👇", env);
    }

    // =====================
    // CALLBACK BUTTONS
    // =====================
    if (update.callback_query) {

      const data = update.callback_query.data;
      const chatId = update.callback_query.message.chat.id;
      const messageId = update.callback_query.message.message_id;

      await answerCallback(update.callback_query.id, env);

      switch (data) {

        case "home":
          return editMenu(chatId, messageId, env);

        case "new":
          return editText(chatId, messageId, "🆕 تازه‌ها (به زودی)", env);

        case "updates":
          return editText(chatId, messageId, "🔥 آخرین آپدیت‌ها (فقط سریال‌ها)", env);

        case "popular":
          return editText(chatId, messageId, "📈 پربازدیدترین سریال‌ها", env);

        case "search":
          return editText(chatId, messageId, "🔍 جستجو (فعلاً آماده نیست)", env);

        case "fav":
          return editText(chatId, messageId, "❤️ علاقه‌مندی‌ها", env);

        case "schedule":
          return editText(chatId, messageId, "📅 جدول پخش", env);

        case "support":
          return editText(
            chatId,
            messageId,
            "💬 پشتیبانی\n\nلطفاً پیام خود را ارسال کنید",
            env
          );
      }
    }

    return new Response("OK");
  }
};

// =====================
// MAIN MENU (EDIT MESSAGE STYLE)
// =====================
async function sendMenu(chatId, env) {

  const text = "🎬 ربات سریال\n\nیکی از گزینه‌ها را انتخاب کنید:";

  const keyboard = {
    inline_keyboard: [
      [{ text: "🆕 تازه‌ها", callback_data: "new" }],
      [
        { text: "🔥 آخرین آپدیت‌ها", callback_data: "updates" },
        { text: "📈 پربازدیدترین‌ها", callback_data: "popular" }
      ],
      [{ text: "🔍 جستجو", callback_data: "search" }],
      [
        { text: "❤️ علاقه‌مندی‌ها", callback_data: "fav" },
        { text: "📅 جدول پخش", callback_data: "schedule" }
      ],
      [{ text: "💬 پشتیبانی", callback_data: "support" }]
    ]
  };

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: keyboard
    })
  });
}

// =====================
// EDIT MENU (BACK BUTTON STYLE)
// =====================
async function editMenu(chatId, messageId, env) {

  const text = "🎬 ربات سریال\n\nیکی از گزینه‌ها را انتخاب کنید:";

  const keyboard = {
    inline_keyboard: [
      [{ text: "🆕 تازه‌ها", callback_data: "new" }],
      [
        { text: "🔥 آخرین آپدیت‌ها", callback_data: "updates" },
        { text: "📈 پربازدیدترین‌ها", callback_data: "popular" }
      ],
      [{ text: "🔍 جستجو", callback_data: "search" }],
      [
        { text: "❤️ علاقه‌مندی‌ها", callback_data: "fav" },
        { text: "📅 جدول پخش", callback_data: "schedule" }
      ],
      [{ text: "💬 پشتیبانی", callback_data: "support" }]
    ]
  };

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: keyboard
    })
  });
}

// =====================
// EDIT TEXT (SIMPLE PAGE)
// =====================
async function editText(chatId, messageId, text, env) {

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 بازگشت", callback_data: "home" }]
    ]
  };

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: keyboard
    })
  });
}

// =====================
async function sendMessage(chatId, text, env) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

async function answerCallback(id, env) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id })
  });
    }
