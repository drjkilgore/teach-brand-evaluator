// netlify/functions/health.mjs
// Synchronous diagnostic — open in a browser:
//   https://YOUR-SITE.netlify.app/.netlify/functions/health
// Reports which env vars are set and confirms the v3 code is what's deployed.
export default async () => {
  const envs = {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY
  };
  const missing = Object.keys(envs).filter(k => !envs[k]);

  // Also verify the function can actually reach the Supabase table.
  let supabase_check = "skipped (env vars missing)";
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const r = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/evaluations?select=id&limit=1", {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_KEY
        }
      });
      supabase_check = r.ok ? "OK — table reachable"
        : "FAILED (" + r.status + "): " + (await r.text()).slice(0, 160);
    } catch (e) {
      supabase_check = "FAILED: " + String(e.message || e);
    }
  }

  return new Response(JSON.stringify({
    version: "v3-supabase",
    status: missing.length ? "NOT READY" : (supabase_check.startsWith("OK") ? "READY" : "ENV OK, SUPABASE PROBLEM"),
    env_vars_set: envs,
    missing: missing,
    supabase_check: supabase_check,
    reminder: "A blank page at /evaluate-background is NORMAL — background functions never return a visible response."
  }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
};
