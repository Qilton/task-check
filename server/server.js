const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGitHubRepoInfo = (repoUrl) => {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { username: match[1], repo: match[2] };
};

const fetchGitHubFile = async (username, repo, filePath) => {
  try {
    const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/${filePath}`;
    console.log(` Fetching: ${rawUrl}`);

    const response = await axios.get(rawUrl);
    return response.data;
  } catch (error) {
    console.warn(` Warning: Failed to fetch ${filePath} (${error.response?.status || "Unknown Error"})`);
    return null;
  }
};

const analyzeCodeWithGemini = async (taskNumber, htmlCode, cssCode) => {
  try {
    const taskPrompts = {
      1: "Ensure index.html prints 'Hello World'.",
      2: "Check for proper HTML structure and semantic elements.",
      3: "Validate if Tailwind classes are correctly applied.",
      4: "Check if authentication is properly implemented.",
    };

    const taskPrompt = taskPrompts[taskNumber] || "Analyze the submitted HTML and CSS for correctness and best practices.";

    const aiPrompt = `
      Task ${taskNumber}: ${taskPrompt}
      
      Here is the submitted index.html:
      ${htmlCode}
      
      Here is the submitted style.css:
      ${cssCode || "No CSS file was provided."}
      
      Your response must be in one of these two formats only:
      - If the code correctly fulfills the task: **"Correct"**
      - If the code has issues: **"Error: [reason]"** (reason should be short and clear)

      Do not provide explanations, do not format as paragraphs. Only return "Correct" or "Error: [reason]".
    `;

    console.log(" Sending request to Google Gemini...");

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;

    console.log(" AI Response:", response.text());

    return response.text().trim();
  } catch (error) {
    console.error(" AI Analysis Failed:", error);
    return "AI analysis could not be completed due to an error.";
  }
};

app.post("/submit", async (req, res) => {
  const { taskNumber, submissionLink } = req.body;

  if (!taskNumber || !submissionLink) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  console.log(" Received Submission:", { taskNumber, submissionLink });

  const repoInfo = getGitHubRepoInfo(submissionLink);
  if (!repoInfo) {
    return res.status(400).json({ message: "Invalid GitHub repository URL." });
  }

  console.log(" Fetching files for", repoInfo.username, repoInfo.repo);

  const indexHtml = await fetchGitHubFile(repoInfo.username, repoInfo.repo, "index.html");

  if (!indexHtml) {
    return res.status(400).json({ message: " index.html is required but was not found in the repository." });
  }

  const styleCss = await fetchGitHubFile(repoInfo.username, repoInfo.repo, "style.css");

  const aiFeedback = await analyzeCodeWithGemini(taskNumber, indexHtml, styleCss);

  console.log(" Returning response to client.");

  res.json({
    message: " Submission received successfully!",
    taskNumber,
    submissionLink,
    files: {
      indexHtml,
      styleCss: styleCss || "⚠️ No style.css found in the repository.",
    },
    aiFeedback,
  });
});

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
