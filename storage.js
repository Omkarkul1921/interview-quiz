// ========================================
// GITHUB STORAGE API (FIXED VERSION)
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
        // Try to get token from sessionStorage
        this.token = sessionStorage.getItem('github_token');
        
        if (!this.token) {
            console.log('No GitHub token found. Admin features disabled.');
        }
    }

    setToken(token) {
        this.token = token;
        sessionStorage.setItem('github_token', token);
        location.reload(); // Reload to apply token
    }

    async getAllResults() {
        try {
            // Try to fetch from results folder
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results`);
            
            if (response.status === 404) {
                console.log('Results folder not found yet. No results to display.');
                return [];
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch results: ${response.status}`);
            }

            const files = await response.json();
            const results = [];

            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    try {
                        const content = await this.getFileContent(file.download_url);
                        results.push(content);
                    } catch (err) {
                        console.error(`Error loading file ${file.name}:`, err);
                    }
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
        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.status}`);
        }
        return await response.json();
    }

    async saveResult(resultData) {
        if (!this.token) {
            console.error('Cannot save: No GitHub token configured');
            alert('❌ Cannot save results: GitHub token not configured.\n\nPlease enter your GitHub token at the start of the quiz.');
            return false;
        }

        try {
            const filename = `results/result-${Date.now()}-${resultData.email.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(resultData, null, 2))));

            console.log('Attempting to save result to:', filename);

            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
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
                
                // If results folder doesn't exist, try creating it
                if (response.status === 404 || response.status === 422) {
                    console.log('Results folder might not exist. Attempting to create...');
                    await this.createResultsFolder();
                    // Retry save
                    return await this.saveResult(resultData);
                }
                
                throw new Error(`Failed to save result: ${response.status} - ${error.message}`);
            }

            console.log('✅ Result saved successfully!');
            return true;
        } catch (error) {
            console.error('Error saving result:', error);
            alert(`❌ Failed to save results.\n\nError: ${error.message}\n\nPlease check:\n1. GitHub token is valid\n2. Token has 'repo' permissions\n3. Internet connection is stable`);
            return false;
        }
    }

    async createResultsFolder() {
        try {
            const content = btoa('# Results folder for quiz submissions\n');
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results/.gitkeep`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Create results folder',
                    content: content,
                    branch: this.branch
                })
            });

            if (response.ok) {
                console.log('✅ Results folder created successfully!');
                return true;
            } else {
                console.error('Failed to create results folder:', await response.json());
                return false;
            }
        } catch (error) {
            console.error('Error creating results folder:', error);
            return false;
        }
    }

    async checkDuplicate(email) {
        const results = await this.getAllResults();
        return results.some(r => r.email.toLowerCase() === email.toLowerCase());
    }

    async deleteAllResults() {
        if (!this.token) {
            alert('❌ GitHub token not configured. Cannot delete results.');
            return false;
        }

        try {
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.status === 404) {
                console.log('No results folder found - nothing to delete');
                return true;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch results: ${response.status}`);
            }

            const files = await response.json();

            for (const file of files) {
                if (file.name === '.gitkeep') continue; // Keep the folder structure
                
                await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/results/${file.name}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
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

            console.log('✅ All results deleted successfully!');
            return true;
        } catch (error) {
            console.error('Error deleting results:', error);
            alert(`❌ Failed to delete results: ${error.message}`);
            return false;
        }
    }
}

const storage = new GitHubStorage();
