// netlify/functions/result.mjs
// Polling endpoint: returns {status:"pending"} until the background job writes its result.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });
  const store = getStore("evals");
  const val = await store.get(id, { type: "json" });
  if (val === null || val === undefined) return Response.json({ status: "pending" });
  await store.delete(id); // single consumer; keep the store clean
  if (val.__error) return Response.json({ status: "error", error: val.__error });
  return Response.json({ status: "done", result: val });
};
