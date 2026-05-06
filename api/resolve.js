// Vercel サーバーレス関数: Google Maps 短縮URLを展開して最終URLを返す
const GOOGLE_MAPS_HOSTS = new Set(["google.com", "maps.google.com", "goo.gl", "maps.app.goo.gl"]);

function isGoogleMapsHost(hostname) {
  return (
    GOOGLE_MAPS_HOSTS.has(hostname) || hostname.endsWith(".google.com")
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = String(req.body?.url ?? "").trim();
  if (!url) {
    return res.status(400).json({ error: "URLを入力してください。" });
  }

  let requestedUrl;
  try {
    requestedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "URLの形式が正しくありません。" });
  }

  const requestedHost = requestedUrl.hostname
    .replace(/^www\./i, "")
    .toLowerCase();
  if (!isGoogleMapsHost(requestedHost)) {
    return res
      .status(400)
      .json({ error: "Google Maps のURLだけ展開できます。" });
  }

  let finalUrl;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "SpotMapOrganizer/1.0" },
    });
    finalUrl = response.url;
  } catch {
    return res
      .status(502)
      .json({ error: "短縮URLの展開に失敗しました。ネットワーク接続を確認してください。" });
  }

  const hostname = new URL(finalUrl).hostname
    .replace(/^www\./i, "")
    .toLowerCase();

  if (!isGoogleMapsHost(hostname)) {
    return res
      .status(400)
      .json({ error: "Google Maps のURLとして展開できませんでした。" });
  }

  return res.status(200).json({ url: finalUrl });
}
