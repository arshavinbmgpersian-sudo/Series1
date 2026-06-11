function trackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SUB-";

  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function activationCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VIP-";

  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ثبت اشتراک
    if (
      request.method === "POST" &&
      url.pathname === "/api/create-subscription"
    ) {
      try {
        const form = await request.formData();

        const fullname = form.get("fullname") || "";
        const phone = form.get("phone") || "";
        const telegramId = form.get("telegram_id") || "";
        const plan = form.get("plan") || "";
        const receipt = form.get("receipt");

        const code = trackingCode();

        await env.DB.prepare(`
          INSERT INTO subscriptions (
            tracking_code,
            fullname,
            phone,
            telegram_id,
            plan,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          code,
          fullname,
          phone,
          telegramId,
          plan,
          "pending"
        )
        .run();

        if (receipt) {
          const tg = new FormData();

          tg.append("chat_id", env.CHAT_ID);

          tg.append(
            "caption",
`🎬 درخواست اشتراک جدید

👤 ${fullname}
📱 ${phone}
💬 ${telegramId || "ندارد"}
📦 ${plan}

🆔 ${code}`
          );

          tg.append(
            "photo",
            receipt,
            receipt.name || "receipt.jpg"
          );

          await fetch(
            `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
            {
              method: "POST",
              body: tg
            }
          );
        }

        return Response.json({
          success: true,
          tracking_code: code
        });

      } catch (e) {
        return Response.json({
          success: false,
          error: e.message
        });
      }
    }

    // وضعیت اشتراک
    if (
      request.method === "GET" &&
      url.pathname === "/api/status"
    ) {
      const tracking =
        url.searchParams.get("tracking");

      const row = await env.DB.prepare(`
        SELECT
          status,
          activation_code
        FROM subscriptions
        WHERE tracking_code = ?
      `)
      .bind(tracking)
      .first();

      if (!row) {
        return Response.json({
          found: false
        });
      }

      return Response.json({
        found: true,
        status: row.status,
        activation_code: row.activation_code
      });
    }

    // تایید دستی
    if (
      request.method === "POST" &&
      url.pathname === "/api/admin/approve"
    ) {
      const key =
        request.headers.get("x-admin-key");

      if (key !== env.ADMIN_KEY) {
        return new Response(
          "Unauthorized",
          { status: 401 }
        );
      }

      const body =
        await request.json();

      const vip =
        activationCode();

      await env.DB.prepare(`
        UPDATE subscriptions
        SET
          status='approved',
          activation_code=?
        WHERE tracking_code=?
      `)
      .bind(
        vip,
        body.tracking_code
      )
      .run();

      return Response.json({
        success: true,
        activation_code: vip
      });
    }

    return new Response(
      "SeriexDL Subscription API"
    );
  }
};
