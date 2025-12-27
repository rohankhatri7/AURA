type RouteParams = {
  params: {
    filename: string
  }
}

export async function GET(_req: Request, { params }: RouteParams) {
  const filename = encodeURIComponent(params.filename)
  const upstream = await fetch(`http://127.0.0.1:8000/audio/${filename}`)
  const contentType = upstream.headers.get("content-type") || "audio/mpeg"

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store",
    },
  })
}
