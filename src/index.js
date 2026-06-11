function generateCode(){
  return "SUB-" + Math.random().toString(36).substring(2,10).toUpperCase();
}

export default {
async fetch(request, env){

const url = new URL(request.url);

// CORS
const cors = {
"Access-Control-Allow-Origin":"*",
"Access-Control-Allow-Methods":"POST,GET,OPTIONS",
"Access-Control-Allow-Headers":"Content-Type"
};

if(request.method==="OPTIONS"){
return new Response(null,{headers:cors});
}

/* =======================
   ایجاد درخواست خرید
======================= */
if(request.method==="POST" && url.pathname==="/api/create"){

const form = await request.formData();

const phone = form.get("phone");

// 🔴 چک: آیا قبلاً pending دارد؟
const existing = await env.DB.prepare(`
SELECT * FROM subscriptions
WHERE phone = ? AND status = 'pending'
`).bind(phone).first();

if(existing){
return Response.json({
success:false,
message:"شما یک درخواست در حال بررسی دارید"
},{headers:cors});
}

const code = generateCode();

await env.DB.prepare(`
INSERT INTO subscriptions
(tracking_code, fullname, phone, telegram_id, plan, status)
VALUES (?,?,?,?,?,?)
`)
.bind(
code,
form.get("fullname"),
phone,
form.get("telegram_id") || "",
form.get("plan"),
"pending"
)
.run();

// ارسال عکس برای تو (اختیاری)
const receipt = form.get("receipt");

const tg = new FormData();
tg.append("chat_id", env.CHAT_ID);

tg.append("caption",
`📥 درخواست جدید

👤 ${form.get("fullname")}
📱 ${phone}
📦 ${form.get("plan")}
🆔 ${code}`
);

if(receipt){
tg.append("photo", receipt);
}

await fetch(
`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
{
method:"POST",
body:tg
}
);

return Response.json({
success:true,
tracking_code:code
},{headers:cors});
}

/* =======================
   لیست برای ادمین
======================= */
if(request.method==="GET" && url.pathname==="/api/admin/list"){

const data = await env.DB.prepare(`
SELECT * FROM subscriptions
ORDER BY id DESC
`).all();

return Response.json(data.results,{headers:cors});
}

/* =======================
   تایید / رد
======================= */
if(request.method==="POST" && url.pathname==="/api/admin/update"){

const body = await request.json();

await env.DB.prepare(`
UPDATE subscriptions
SET status = ?, activation_code = ?
WHERE tracking_code = ?
`)
.bind(
body.status,
body.activation_code || "",
body.code
)
.run();

return Response.json({success:true},{headers:cors});
}

return new Response("OK");
}
};
