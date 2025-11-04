import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).end();
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, GITHUB_BRANCH } = process.env;

  const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/results`;
  const response = await fetch(baseUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });

  if (response.status === 404) return res.json({ success: true });
  const files = await response.json();

  for (const file of files) {
    await fetch(`${baseUrl}/${file.name}`, {
      method: "DELETE",
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
      body: JSON.stringify({
        message: `Delete ${file.name}`,
        sha: file.sha,
        branch: GITHUB_BRANCH
      })
    });
  }

  res.json({ success: true });
}
