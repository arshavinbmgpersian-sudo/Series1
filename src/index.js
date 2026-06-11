function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SUB-";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // ✅ CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    /* =========================
       CREATE SUBSCRIPTION
    ========================= */
    if (request.method === "POST" && url.pathname === "/api/create-subscription") {

      try {

        const form = await request.formData();

        const fullname = form.get("fullname") || "";
        const phone = form.get("phone") || "";
        const telegram_id = form.get("telegram_id") || "";
        const plan = form.get("plan") || "";
        const receipt = form.get("receipt");

        // ❌ validation ساده
        if (!phone || !plan) {
          return Response.json({
            success: false,
            message: "اطلاعات ناقص است"
          }, { headers: cors });
        }

        // ❌ جلوگیری از درخواست تکراری pending
        const exists = await env.DB.prepare(`
          SELECT * FROM subscriptions
          WHERE phone = ? AND status = 'pending'
        `).bind(phone).first();

        if (exists) {
          return Response.json({
            success: false,
            message: "شما یک درخواست در حال بررسی دارید"
          }, { headers: cors });
        }

        const code = generateCode();

        // 💾 ذخیره در D1
        await env.DB.prepare(`
          INSERT INTO subscriptions
          (tracking_code, fullname, phone, telegram_id, plan, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(code, fullname, phone, telegram_id, plan, "pending")
        .run();

        // 📩 ارسال عکس برای تو (اختیاری)
        const tg = new FormData();

        tg.append("chat_id", env.CHAT_ID);

        tg.append("caption",
`📥 درخواست جدید اشتراک

👤 نام: ${fullname}
📱 موبایل: ${phone}
💬 تلگرام: ${telegram_id || "ندارد"}
📦 پلن: ${plan}

🆔 کد: ${code}
⏳ وضعیت: pending`
        );

        if (receipt) {
          tg.append("photo", receipt, "receipt.jpg");
        }

        await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
          {
            method: "POST",
            body: tg
          }
        );

        return Response.json({
          success: true,
          tracking_code: code
        }, { headers: cors });

      } catch (err) {
        return Response.json({
          success: false,
          message: "Server error"
        }, { headers: cors });
      }
    }

    /* =========================
       STATUS CHECK
    ========================= */
    if (request.method === "GET" && url.pathname === "/api/status") {

      const tracking = url.searchParams.get("tracking");

      const row = await env.DB.prepare(`
        SELECT status, activation_code
        FROM subscriptions
        WHERE tracking_code = ?
      `).bind(tracking).first();

      if (!row) {
        return Response.json({
          found: false
        }, { headers: cors });
      }

      return Response.json({
        found: true,
        status: row.status,
        activation_code: row.activation_code
      }, { headers: cors });
    }

    /* =========================
       DEFAULT
    ========================= */
    return new Response("OK");
  }
};
