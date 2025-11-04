// ========================================
// GITHUB CONFIGURATION (NO TOKEN HERE!)
// ========================================
const GITHUB_CONFIG = {
    owner: "Omkarkul1921",
    repo: "interview-quiz",
    branch: "main",
    apiBase: "https://interview-quiz-api.vercel.app/api" // 🔹 your backend URL (we’ll set up next)
};

// ========================================
// ADMIN PASSWORD
// ========================================
const ADMIN_PASSWORD = "admin123";

// ========================================
// QUIZ CONFIGURATION
// ========================================
const QUIZ_CONFIG = {
    title: "Technical Interview Quiz",
    timePerQuestion: 20,
    passingScore: 70,
    questions: [
        { id: 1, question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"], correctAnswer: 0 },
        { id: 2, question: "Which programming language is known as the 'language of the web'?", options: ["Python", "JavaScript", "Java", "C++"], correctAnswer: 1 },
        { id: 3, question: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"], correctAnswer: 1 },
        { id: 4, question: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Stack", "Array", "Tree"], correctAnswer: 1 },
        { id: 5, question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctAnswer: 1 },
        { id: 6, question: "Which HTTP method is used to retrieve data?", options: ["POST", "PUT", "GET", "DELETE"], correctAnswer: 2 },
        { id: 7, question: "What does API stand for?", options: ["Application Programming Interface", "Advanced Programming Interface", "Application Process Integration", "Automated Programming Interface"], correctAnswer: 0 },
        { id: 8, question: "Which is NOT a JavaScript framework?", options: ["React", "Angular", "Django", "Vue"], correctAnswer: 2 },
        { id: 9, question: "What is the purpose of Git?", options: ["Database management", "Version control", "Web hosting", "Code compilation"], correctAnswer: 1 },
        { id: 10, question: "Which SQL command is used to retrieve data?", options: ["GET", "SELECT", "FETCH", "RETRIEVE"], correctAnswer: 1 }
    ]
};

// ========================================
// GITHUB STORAGE API (SAFE VIA BACKEND)
// ========================================
class GitHubStorage {
    constructor() {
        this.baseUrl = `${GITHUB_CONFIG.apiBase}/results`;
    }

    async getAllResults() {
        try {
            const response = await fetch(`${this.baseUrl}/list`);
            return await response.json();
        } catch (error) {
            console.error("Error loading results:", error);
            return [];
        }
    }

    async saveResult(resultData) {
        try {
            const response = await fetch(`${this.baseUrl}/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resultData)
            });
            if (!response.ok) throw new Error("Failed to save result");
            return true;
        } catch (error) {
            console.error("Error saving result:", error);
            alert("Failed to save result. Please try again.");
            return false;
        }
    }

    async checkDuplicate(email) {
        const results = await this.getAllResults();
        return results.some(r => r.email?.toLowerCase() === email.toLowerCase());
    }

    async deleteAllResults(adminPassword) {
        if (adminPassword !== ADMIN_PASSWORD) {
            alert("Incorrect admin password.");
            return false;
        }
        try {
            const response = await fetch(`${this.baseUrl}/delete`, { method: "DELETE" });
            return response.ok;
        } catch (error) {
            console.error("Error deleting results:", error);
            return false;
        }
    }
}

const storage = new GitHubStorage();
