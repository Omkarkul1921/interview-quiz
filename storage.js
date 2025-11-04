// ========================================
// GITHUB STORAGE API (SECURE VERSION)
// ========================================
class GitHubStorage {
    constructor() {
        this.owner = "Omkarkul1921";
        this.repo = "interview-quiz";
        this.branch = "main";
        this.token = null;
        this.loadToken();
    }

    loadToken() {
        // Try to get token from sessionStorage (temporary, cleared when browser closes)
        this.token = sessionStorage.getItem('github_token');
        
        if (!this.token) {
            // Only needed for admin operations, not for reading
            console.log('No GitHub token found. Admin features disabled.');
        }
    }

    setToken(token) {
        this.token = token;
        sessionStorage.setItem('github_token', token);
    }

    async getAllResults() {
        try {
            // Try without authentication first (works for public repos)
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results`);
            
            if (response.status === 404) {
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
        if (!this.token) {
            alert('GitHub token not configured. Cannot save results.');
            return false;
        }

        try {
            const filename = `results/result-${Date.now()}-${resultData.email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(resultData, null, 2))));

            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Add quiz result for ${resultData.name}`,
                    content: content,
                    branch: this.branch
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('GitHub API Error:', error);
                throw new Error('Failed to save result');
            }

            return true;
        } catch (error) {
            console.error('Error saving result:', error);
            alert('Failed to save results. Please check your configuration.');
            return false;
        }
    }

    async checkDuplicate(email) {
        const results = await this.getAllResults();
        return results.some(r => r.email.toLowerCase() === email.toLowerCase());
    }

    async deleteAllResults() {
        if (!this.token) {
            alert('GitHub token not configured. Cannot delete results.');
            return false;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 404) {
                return true;
            }

            const files = await response.json();

            for (const file of files) {
                await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results/${file.name}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Delete ${file.name}`,
                        sha: file.sha,
                        branch: this.branch
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
