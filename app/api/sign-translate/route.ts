import { NextResponse } from "next/server";

function normalizeEnv(value: string | undefined) {
  if (!value) return "";
  return value.trim().replace(/^["']|["']$/g, "");
}

function pickTranslation(data: any): string {
  return (
    data?.translation ||
    data?.text ||
    data?.result?.text ||
    data?.result?.translation ||
    data?.predicted_text ||
    data?.prediction ||
    data?.output?.text ||
    data?.choices?.[0]?.message?.content ||
    "Gesture unclear."
  );
}

function normalizeApiUrlWithKey(url: string, key: string) {
  try {
    const u = new URL(url);
    if (!u.searchParams.get("api_key")) u.searchParams.set("api_key", key);
    return u.toString();
  } catch {
    return url;
  }
}

function resolveRobouxUrl(rawUrl: string) {
  const url = normalizeEnv(rawUrl);
  if (!url) return "";
  if (!url.includes("serverless.roboflow.com")) return url;
  if (!/^https?:\/\/serverless\.roboflow\.com\/?$/i.test(url)) return url;

  const workspace =
    normalizeEnv(process.env.ROBOUX_WORKSPACE || process.env.NEXT_PUBLIC_ROBOUX_WORKSPACE) || "";
  const workflow =
    normalizeEnv(process.env.ROBOUX_WORKFLOW || process.env.NEXT_PUBLIC_ROBOUX_WORKFLOW) || "";

  if (
    !workspace ||
    !workflow ||
    workspace.toUpperCase().startsWith("PASTE_") ||
    workflow.toUpperCase().startsWith("PASTE_")
  ) {
    return url;
  }

  return `https://serverless.roboflow.com/infer/workflows/${workspace}/${workflow}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageBase64 = body?.image_base64 || body?.image || "";
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image payload" }, { status: 400 });
    }

    const apiUrl = resolveRobouxUrl(process.env.ROBOUX_API_URL || process.env.NEXT_PUBLIC_ROBOUX_API_URL || "");
    const apiKey = normalizeEnv(process.env.ROBOUX_API_KEY || process.env.NEXT_PUBLIC_ROBOUX_API_KEY);
    const keyHeader = normalizeEnv(process.env.ROBOUX_API_KEY_HEADER || process.env.NEXT_PUBLIC_ROBOUX_API_KEY_HEADER) || "Authorization";
    const keyPrefix = normalizeEnv(process.env.ROBOUX_API_KEY_PREFIX || process.env.NEXT_PUBLIC_ROBOUX_API_KEY_PREFIX) || "Bearer ";

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: "Missing ROBOUX_API_URL/ROBOUX_API_KEY env configuration" },
        { status: 500 },
      );
    }

    const requestBody = JSON.stringify({
      image_base64: imageBase64,
      image: imageBase64,
      mime_type: "image/jpeg",
      prompt:
        "Infer the hand gesture meaning from this frame. Return only short plain text. If unclear, return: Gesture unclear.",
      // Roboflow workflow serverless format
      inputs: {
        image: {
          type: "base64",
          value: imageBase64,
        },
      },
    });

    const authAttempts: Array<{ url: string; headers: Record<string, string> }> = [
      {
        url: apiUrl,
        headers: {
          "Content-Type": "application/json",
          [keyHeader]: `${keyPrefix}${apiKey}`,
        },
      },
      {
        url: apiUrl,
        headers: {
          "Content-Type": "application/json",
          [keyHeader]: apiKey,
        },
      },
      {
        url: apiUrl,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      },
      {
        url: normalizeApiUrlWithKey(apiUrl, apiKey),
        headers: {
          "Content-Type": "application/json",
        },
      },
    ];

    let upstreamRes: Response | null = null;
    let raw = "";
    let parsed: any = {};

    for (const attempt of authAttempts) {
      upstreamRes = await fetch(attempt.url, {
        method: "POST",
        headers: attempt.headers,
        body: requestBody,
      });

      raw = await upstreamRes.text();
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = { raw };
      }

      if (upstreamRes.ok) break;
      if (![401, 403].includes(upstreamRes.status)) break;
    }

    // Fallback for Roboflow-style endpoints that expect query api_key + multipart file.
    if (
      upstreamRes &&
      !upstreamRes.ok &&
      (upstreamRes.status === 400 || upstreamRes.status === 405) &&
      apiUrl.includes("roboflow.com")
    ) {
      const urlWithKey = normalizeApiUrlWithKey(apiUrl, apiKey);
      const commaIdx = imageBase64.indexOf(",");
      const pureBase64 = commaIdx >= 0 ? imageBase64.slice(commaIdx + 1) : imageBase64;
      const bytes = Buffer.from(pureBase64, "base64");
      const form = new FormData();
      form.append("file", new Blob([bytes], { type: "image/jpeg" }), "frame.jpg");

      upstreamRes = await fetch(urlWithKey, {
        method: "POST",
        body: form,
      });
      raw = await upstreamRes.text();
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = { raw };
      }
    }

    if (!upstreamRes || !upstreamRes.ok) {
      const workspace =
        normalizeEnv(process.env.ROBOUX_WORKSPACE || process.env.NEXT_PUBLIC_ROBOUX_WORKSPACE) || "";
      const workflow =
        normalizeEnv(process.env.ROBOUX_WORKFLOW || process.env.NEXT_PUBLIC_ROBOUX_WORKFLOW) || "";
      const hasPlaceholderConfig =
        workspace.toUpperCase().startsWith("PASTE_") || workflow.toUpperCase().startsWith("PASTE_");
      const details =
        parsed?.error ||
        parsed?.message ||
        parsed?.detail ||
        raw ||
        "Roboux upstream failed";
      return NextResponse.json(
        {
          error: details,
          hint: hasPlaceholderConfig
            ? "Set real NEXT_PUBLIC_ROBOUX_WORKSPACE and NEXT_PUBLIC_ROBOUX_WORKFLOW values in .env.local."
            : "Set NEXT_PUBLIC_ROBOUX_API_URL to full endpoint OR set NEXT_PUBLIC_ROBOUX_WORKSPACE and NEXT_PUBLIC_ROBOUX_WORKFLOW.",
        },
        { status: upstreamRes.status || 502 },
      );
    }

    return NextResponse.json({
      translation: String(pickTranslation(parsed)).trim() || "Gesture unclear.",
      raw: parsed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Sign translation request failed" }, { status: 500 });
  }
}
