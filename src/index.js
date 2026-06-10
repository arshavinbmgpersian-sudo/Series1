export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Movie Bot Running");
    }

    const update = await request.json();

    if (update.message) {

      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      await fetch(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: `پیام شما: ${text}`
          })
        }
      );
    }

    return new Response("OK");
  }
}
