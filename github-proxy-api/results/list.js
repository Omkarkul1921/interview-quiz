import fetch from "node-fetch";

export default async function handler(req, res) {
  const { GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN } = process.env;
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/results`;

  const response = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });

  if (response.status === 404) return res.json([]);
  const files = await response.json();

  const results = [];
  for (const file of files) {
    if (file.name.endsWith(".json")) {
      const content = await fetch(file.download_url).then(r => r.json());
      results.push(content);
    }
  }

  res.json(results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
}
