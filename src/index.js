export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Movie Bot Running");
    }

    const update = await request.json();

    // پیام های متنی
    if (update.message) {

      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      if (text === "/start") {

        await sendMainMenu(chatId, env);

      } else {

        await sendMessage(
          chatId,
          "از منوی زیر استفاده کنید 👇",
          env
        );

      }
    }

    // کلیک روی دکمه ها
    if (update.callback_query) {

      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;

      await answerCallback(update.callback_query.id, env);

      switch (data) {

        case "new":
          await sendMessage(chatId, "🆕 بخش تازه‌ها", env);
          break;

        case "updates":
          await sendMessage(chatId, "🔥 آخرین آپدیت‌ها", env);
          break;

        case "popular":
          await sendMessage(chatId, "📈 پربازدیدترین‌ها", env);
          break;

        case "search":
          await sendMessage(chatId, "🔍 جستجو به‌زودی اضافه می‌شود", env);
          break;

        case "fav":
          await sendMessage(chatId, "❤️ علاقه‌مندی‌های شما", env);
          break;

        case "schedule":
          await sendMessage(chatId, "📅 جدول پخش", env);
          break;

        case "support":
          await sendMessage(
            chatId,
            "💬 لطفاً پیام خود را ارسال کنید.\n\n(سیستم پشتیبانی را در مرحله بعد وصل می‌کنیم)",
            env
          );
          break;
      }
    }

    return new Response("OK");
  }
};

async function sendMainMenu(chatId, env) {

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🆕 تازه‌ها", callback_data: "new" }
      ],
      [
        { text: "🔥 آخرین آپدیت‌ها", callback_data: "updates" },
        { text: "📈 پربازدیدترین‌ها", callback_data: "popular" }
      ],
      [
        { text: "🔍 جستجو", callback_data: "search" }
      ],
      [
        { text: "❤️ علاقه‌مندی‌ها", callback_data: "fav" },
        { text: "📅 جدول پخش", callback_data: "schedule" }
      ],
      [
        { text: "💬 پشتیبانی", callback_data: "support" }
      ]
    ]
  };

  await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🎬 به ربات خوش آمدید",
        reply_markup: keyboard
      })
    }
  );
}

async function sendMessage(chatId, text, env) {

  await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    }
  );
}

async function answerCallback(callbackId, env) {

  await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        callback_query_id: callbackId
      })
    }
  );
}
