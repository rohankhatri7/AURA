export async function POST(req: Request) {
  const formData = await req.formData()
  const upstream = await fetch("http://127.0.0.1:8000/transcribe", {
    method: "POST",
    body: formData,
  })

  const contentType = upstream.headers.get("content-type") || "application/json"
  const body = await upstream.arrayBuffer()

  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  })
}
