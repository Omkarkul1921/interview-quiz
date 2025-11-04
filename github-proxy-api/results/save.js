import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, GITHUB_BRANCH } = process.env;

  const resultData = req.body;
  const filename = `result-${Date.now()}-${resultData.email.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
  const content = Buffer.from(JSON.stringify(resultData, null, 2)).toString("base64");

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/results/${filename}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Add quiz result for ${resultData.name}`,
      content,
      branch: GITHUB_BRANCH
    })
  });

  if (!response.ok) return res.status(400).json({ error: "Failed to save" });
  res.json({ success: true });
}
