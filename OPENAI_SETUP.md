# OpenAI Setup for Wisdom

This update adds a Vercel serverless API at:

/api/guidance

The browser calls this endpoint from script.js. Your OpenAI API key stays private in Vercel.

## Required Vercel Environment Variable

Name:
OPENAI_API_KEY

Value:
Paste your OpenAI API key

Environment:
Production, Preview, Development

After saving the environment variable, redeploy the Vercel project.

Do not paste your OpenAI API key into HTML, CSS, or script.js.
