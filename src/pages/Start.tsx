import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../App';

type PromptBlock = {
  title: string;
  text: string;
};

type ToolLink = {
  name: string;
  description: string;
  url: string;
};

type Phase = {
  eyebrow: string;
  title: string;
  dek: string;
  body: string[];
  bullets?: string[];
  prompt?: PromptBlock;
  prompts?: PromptBlock[];
  tools?: ToolLink[];
  example?: string[];
};

const phases: Phase[] = [
  {
    eyebrow: 'Start here',
    title: "You're closer than you think.",
    dek: 'A straight line from using AI for small tasks to shipping real tools with AI.',
    body: [
      'Someone asked ChatGPT to remove a background from a photo recently. It worked. Then they asked it to unwrinkle a shirt in the image. It worked. Then they thought: wait, what else can this thing do?',
      'That is the moment this page is for. No computer science degree required. No prior coding experience required. Just curiosity and a willingness to try something that might not work on the first attempt.',
      'We will build one real thing together, from scratch, as a way to show you how the whole thing works. By the end, you will know how to ship something real to the internet.',
    ],
    example: [
      'Level 1 - The Prompter: you use AI like a smart search engine',
      'Level 2 - The Tinkerer: you get AI to write code and paste it somewhere',
      'Level 3 - The Builder: you have a real setup and ship things intentionally',
      'Level 4 - The Orchestrator: your agents build things while you sleep',
    ],
  },
  {
    eyebrow: 'Level 1',
    title: 'The Prompter',
    dek: 'You use ChatGPT, Claude, or Gemini for everyday thinking, writing, and editing.',
    body: [
      'This is genuinely useful. But you have probably noticed the ceiling: it can help you think and write, but it cannot really make anything that lives in the world on its own.',
      'The unlock from Level 1 to Level 2 is realizing that AI can write code, and you do not need to understand every line for it to work. You just need to know where to put it.',
    ],
    bullets: [
      'Rewriting an email so it sounds better',
      'Summarizing a long document',
      'Removing a background from a photo',
      'Asking it to explain something you do not understand',
      'Getting recipe ideas or travel suggestions',
    ],
    prompt: {
      title: 'Your first prompt',
      text: `Write me a single HTML file that checks if a local business is open right now. The user types in a business name, clicks a button, and it shows whether they're open or closed based on their Google Maps hours. Make it simple and clean. No frameworks, just plain HTML, CSS, and JavaScript in one file.`,
    },
  },
  {
    eyebrow: 'Level 2',
    title: 'The Tinkerer',
    dek: 'You paste AI-written code into files or browser tools, try it, then ask for fixes.',
    body: [
      'Sometimes it works immediately. Sometimes you paste the error back into the chat and ask it to fix it. You are not really sure what you are doing, but things keep working anyway.',
      'This is the core loop: describe what you want, get code, try it, describe what is wrong or what you want next, repeat. You are not coding. You are directing.',
      'To put the tool online, create a free Netlify account, drag your HTML file into the deploy box, and send someone the URL. That is shipping.',
    ],
    tools: [
      { name: 'Claude.ai', description: 'Best for writing and iterating on code in conversation', url: 'https://claude.ai' },
      { name: 'v0', description: 'Describe a UI and get working code instantly', url: 'https://v0.dev' },
      { name: 'Replit', description: 'Write and run code in your browser', url: 'https://replit.com' },
      { name: 'Bolt', description: 'Describe an app and get a full working version', url: 'https://bolt.new' },
    ],
    prompt: {
      title: 'Make the tool better',
      text: `The HTML file works but I want to make it better. Can you update it to:
1. Show the business hours for the whole week, not just today
2. Add a green/red color indicator for open/closed
3. Make it look good on a phone screen
4. Add a loading spinner while it's fetching

Here's the current code: [paste your code here]`,
    },
  },
  {
    eyebrow: 'Level 3',
    title: 'The Builder',
    dek: 'You have a real project setup and can ship things intentionally.',
    body: [
      'You have shipped a few things. The paste-and-pray loop works, but it has limits. Bigger projects get messy, files multiply, and the AI loses context halfway through complex tasks.',
      'At Level 3, you have a project: multiple files, a folder structure, GitHub, and a deployment flow. The AI is still writing most of the code, but now you are steering a product.',
      'This is the workflow most builders on SLOP LOCAL use: idea to Claude Code or Codex to GitHub to Vercel or Cloudflare Pages to live URL to SLOP LOCAL.',
    ],
    tools: [
      { name: 'Claude Code', description: 'Terminal agent that reads your project and edits multiple files', url: 'https://docs.anthropic.com/claude-code' },
      { name: 'Codex', description: 'OpenAI coding agent for longer autonomous tasks', url: 'https://platform.openai.com/docs/codex' },
      { name: 'GitHub', description: 'Where your code lives online', url: 'https://github.com' },
      { name: 'Vercel', description: 'Deploy finished apps to the internet', url: 'https://vercel.com' },
      { name: 'Cloudflare Pages', description: 'Another strong free deploy option', url: 'https://pages.cloudflare.com' },
    ],
    prompt: {
      title: 'Your first real project prompt',
      text: `I want to build a tool that checks if a local business is open right now. The user types in a business name, it shows their hours and whether they're open or closed.

Please create all the files I need and explain what each one does. I'm new to coding so please keep it simple and walk me through how to run it when you're done.`,
    },
    prompts: [
      {
        title: 'Deploy it',
        text: `My tool is working locally. Can you help me deploy it to Vercel so anyone can use it? Walk me through each step like I've never done this before.`,
      },
    ],
  },
  {
    eyebrow: 'Level 4',
    title: 'The Orchestrator',
    dek: 'Your agent stops being a tool you use and starts becoming a system that runs.',
    body: [
      'Agentic means the AI can break a big task into steps, use tools, make decisions, and run multiple steps without you approving each one.',
      'A simple example: instead of asking Claude to write your SLOP LOCAL submission and then manually posting it, you set up an agent that reads your project, generates the listing, and submits it via the SLOP LOCAL API.',
      'You stop thinking about individual tasks and start thinking about systems. You are not less in control. You are in control at a higher level.',
    ],
    tools: [
      { name: 'MCP', description: 'Lets AI agents connect to external services', url: 'https://modelcontextprotocol.io' },
      { name: 'n8n', description: 'Visual workflow builder for automation', url: 'https://n8n.io' },
      { name: 'Anthropic API', description: 'Build AI-powered tools with Claude under the hood', url: 'https://console.anthropic.com' },
      { name: 'Supabase', description: 'Free database for your apps', url: 'https://supabase.com' },
    ],
    prompt: {
      title: 'Your first agentic prompt',
      text: `I want you to act as an agent that helps me submit my projects to SLOP LOCAL.

Here's what I need you to do:
1. Look at the project in this folder
2. Read the README and any code files to understand what it does
3. Write a tagline under 120 characters that explains what it does and why it's good
4. Pick the right category: tools, creative, games, productivity, or weird
5. Post it to https://sloplocal.com/api/submissions using my API key: [your key here]
6. Tell me what you submitted and confirm it went through

Do all of this without asking me questions — make your best judgment and just do it.`,
    },
    example: [
      'Trigger: you push code to a new GitHub repo',
      'Step 1: agent reads the repo README and code',
      'Step 2: agent generates a name, tagline, and category',
      'Step 3: agent posts to the SLOP LOCAL API with your API key',
      'Step 4: you get a notification that the project is pending review',
    ],
  },
  {
    eyebrow: 'Full build walkthrough',
    title: 'Build Is It Open?',
    dek: 'A real example tool: type any local business name and see whether it is open right now.',
    body: [
      'This is the kind of thing that belongs on SLOP LOCAL. Free, solves a real problem, and can be built by one person in an afternoon.',
      'Start as a single HTML file. Improve it with sharing, maps, recent searches, polish, and dark mode. Then rebuild it as a proper web app when you are ready.',
    ],
    prompts: [
      {
        title: 'Level 1 version',
        text: `Build me a single HTML file called isitopen.html.

When someone opens it they see:
- A text box where they type a business name
- A "Check" button
- Results showing if the business is open right now and their weekly hours

Requirements:
- Everything in one HTML file (HTML, CSS, JavaScript all together)
- Works on mobile phones
- Clean simple design, white background, easy to read
- Show open in green, closed in red
- No frameworks, no npm, no setup needed — just one file that works when you double-click it

Use the Google Places API for the business data. Include instructions for getting a free API key.`,
      },
      {
        title: 'Level 2 version',
        text: `I have a working isitopen.html. I want to make it better:

1. Add a "copy link" button that saves the business search so I can share it
2. Show a map thumbnail of the business location
3. Add recently searched businesses so I don't have to retype
4. Make the design look more polished — still simple but feels like a real product
5. Add a dark mode toggle

Here's my current code: [paste it]`,
      },
      {
        title: 'Level 3 version',
        text: `I want to build "Is It Open?" — a tool where you type a business name and instantly see if they're open right now.

I want this to be a proper web app, not just an HTML file. I want to be able to add features over time.

Please:
1. Set up a proper project structure
2. Build the core feature — search a business, show open/closed status and weekly hours
3. Add a favorites feature so users can save businesses they check often
4. Make it deployable to Vercel
5. Explain each file you create and what it does

I'm new to this so go step by step and check in with me before doing anything major.`,
      },
      {
        title: 'Level 4 version',
        text: `I want to add an automated feature to Is It Open:

Every morning at 8am, check the hours for these businesses [list them] and send me a text summary of what's open today and any that have changed their hours since last week.

Use Twilio for the texts. Set it up as a scheduled job that runs automatically.`,
      },
    ],
    example: [
      'Level 1: ask for one HTML file called isitopen.html',
      'Level 2: add copy link, map thumbnail, recent searches, polish, and dark mode',
      'Level 3: make it a proper project and deploy it',
      'Level 4: add a scheduled agent that checks business hours and texts you updates',
    ],
  },
  {
    eyebrow: 'When you have built something',
    title: 'Drop your slop.',
    dek: 'That is what this whole place is for.',
    body: [
      'Does not matter if it is rough. Does not matter if it took you a week to figure out something that took someone else an hour. Does not matter if a senior developer would call it slop.',
      'If it is free, if it works, and if you put real time into it, it belongs here.',
    ],
  },
];

function PromptCard({ prompt }: { prompt: PromptBlock }) {
  const toast = useToast();

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt.text);
    toast('Prompt copied.');
  }

  return (
    <div className="prompt-card">
      <div className="prompt-card-head">
        <span>{prompt.title}</span>
        <button onClick={copyPrompt}>Copy prompt</button>
      </div>
      <pre><code>{prompt.text}</code></pre>
    </div>
  );
}

export default function Start() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = phases[phaseIndex];
  const isFirst = phaseIndex === 0;
  const isLast = phaseIndex === phases.length - 1;

  function goTo(index: number) {
    setPhaseIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="wrap start-shell">
      <div className="start-header">
        <Link to="/" className="back-link">← Back to the board</Link>
        <div className="section-kicker">From Prompt to Product</div>
        <h1>{phase.title}</h1>
        <p>{phase.dek}</p>
      </div>

      <div className="start-layout">
        <aside className="phase-nav" aria-label="Walkthrough phases">
          {phases.map((p, index) => (
            <button
              key={p.eyebrow}
              className={index === phaseIndex ? 'active' : ''}
              onClick={() => goTo(index)}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {p.eyebrow}
            </button>
          ))}
        </aside>

        <article className="phase-panel">
          <div className="phase-count">{phase.eyebrow} · {phaseIndex + 1} of {phases.length}</div>

          {phase.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {phase.bullets && (
            <ul className="start-list">
              {phase.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}

          {phase.example && (
            <div className="workflow-box">
              {phase.example.map((item) => <div key={item}>{item}</div>)}
            </div>
          )}

          {phase.tools && (
            <div className="tool-grid">
              {phase.tools.map((tool) => (
                <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer">
                  <strong>{tool.name}</strong>
                  <span>{tool.description}</span>
                </a>
              ))}
            </div>
          )}

          {phase.prompt && <PromptCard prompt={phase.prompt} />}
          {phase.prompts?.map((prompt) => <PromptCard key={prompt.title} prompt={prompt} />)}

          <div className="start-actions">
            <button className="btn" onClick={() => goTo(phaseIndex - 1)} disabled={isFirst}>Back</button>
            {isLast ? (
              <>
                <Link to="/submit" className="btn btn-primary">Drop your slop ↗</Link>
                <Link to="/docs/agent" className="btn">Agent setup →</Link>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => goTo(phaseIndex + 1)}>Next phase →</button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
