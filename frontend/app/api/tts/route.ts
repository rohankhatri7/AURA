type TtsRequest = {
  text: string
  session_id?: string
}

const DEFAULT_BACKEND = "http://localhost:8000"

async function fetchAudioFromUrl(url: string) {
  const response = await fetch(url)
  const contentType = response.headers.get("content-type") || "audio/mpeg"
  const body = await response.arrayBuffer()
  return { response, contentType, body }
}

export async function POST(req: Request) {
  const backendBase = process.env.BACKEND_URL || DEFAULT_BACKEND
  let payload: TtsRequest

  try {
    payload = (await req.json()) as TtsRequest
  } catch (error) {
    return Response.json(
      { error: "Invalid JSON body", details: String(error) },
      { status: 400 },
    )
  }

  if (!payload.text) {
    return Response.json({ error: "Missing text" }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${backendBase}/tts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })

    const contentType = upstream.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const data = (await upstream.json()) as Record<string, unknown>
      const audioUrl = data.audioUrl as string | undefined
      const audioBase64 = data.audio_base64 as string | undefined
      const filename = data.filename as string | undefined

      if (audioBase64) {
        const bytes = Buffer.from(audioBase64, "base64")
        return new Response(bytes, {
          status: upstream.status,
          headers: {
            "content-type": "audio/mpeg",
            "cache-control": "no-store",
          },
        })
      }

      if (audioUrl) {
        const resolved = audioUrl.startsWith("http")
          ? audioUrl
          : `${backendBase}${audioUrl.startsWith("/") ? "" : "/"}${audioUrl}`
        const { response, body } = await fetchAudioFromUrl(resolved)
        return new Response(body, {
          status: response.status,
          headers: {
            "content-type": response.headers.get("content-type") || "audio/mpeg",
            "cache-control": "no-store",
          },
        })
      }

      if (filename) {
        const { response, body } = await fetchAudioFromUrl(`${backendBase}/audio/${filename}`)
        return new Response(body, {
          status: response.status,
          headers: {
            "content-type": response.headers.get("content-type") || "audio/mpeg",
            "cache-control": "no-store",
          },
        })
      }

      return Response.json(
        { error: "Backend did not return audio payload", details: data },
        { status: 502 },
      )
    }

    const body = await upstream.arrayBuffer()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": contentType || "audio/mpeg",
        "cache-control": "no-store",
      },
    })
  } catch (error) {
    return Response.json(
      { error: "Failed to reach backend", details: String(error) },
      { status: 502 },
    )
  }
}
