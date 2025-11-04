// ========================================
// GITHUB STORAGE API
// ========================================
class GitHubStorage {
    constructor() {
        this.baseUrl = `https://api.github.com/repos/Omkarkul1921/interview-quiz/contents/results`;
        this.headers = {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    }

    async getAllResults() {
        try {
            const response = await fetch(this.baseUrl, { headers: this.headers });
            
            if (response.status === 404) {
                // Results folder doesn't exist yet
                return [];
            }
            
            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }

            const files = await response.json();
            const results = [];

            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    const content = await this.getFileContent(file.download_url);
                    results.push(content);
                }
            }

            return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error loading results:', error);
            return [];
        }
    }

    async getFileContent(url) {
        const response = await fetch(url);
        return await response.json();
    }

    async saveResult(resultData) {
        try {
            const filename = `result-${Date.now()}-${resultData.email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(resultData, null, 2))));

            const response = await fetch(`${this.baseUrl}/${filename}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({
                    message: `Add quiz result for ${resultData.name}`,
                    content: content,
                    branch: GITHUB_CONFIG.branch
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save result');
            }

            return true;
        } catch (error) {
            console.error('Error saving result:', error);
            alert('Failed to save results. Please check your internet connection.');
            return false;
        }
    }

    async checkDuplicate(email) {
        const results = await this.getAllResults();
        return results.some(r => r.email.toLowerCase() === email.toLowerCase());
    }

    async deleteAllResults() {
        try {
            const response = await fetch(this.baseUrl, { headers: this.headers });
            
            if (response.status === 404) {
                return true;
            }

            const files = await response.json();

            for (const file of files) {
                await fetch(`${this.baseUrl}/${file.name}`, {
                    method: 'DELETE',
                    headers: this.headers,
                    body: JSON.stringify({
                        message: `Delete ${file.name}`,
                        sha: file.sha,
                        branch: GITHUB_CONFIG.branch
                    })
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting results:', error);
            return false;
        }
    }
}

const storage = new GitHubStorage();
