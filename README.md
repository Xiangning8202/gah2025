# Project Story

<img width="3432" height="4852" alt="Frame 2" src="https://github.com/user-attachments/assets/d66f14fd-0205-410d-b013-217c9e8af04b" />

## What if you could break your AI agents before the bad guys do?

That's the question that kicked off this whole thing. AI agents are everywhere now—chatbots, workflow automators, you name it—but nobody's really testing them for security vulnerabilities. Prompt injection attacks? Input validation? Most people just YOLO it into production and hope for the best.

We built a visual red-teaming platform specifically for LangGraph agent systems. Think of it as a security testing playground where you can drag-and-drop attack nodes onto your agent workflow and watch in real-time as your carefully crafted AI gets absolutely wrecked by a fuzzer or a prompt injection attack.

## The Stack

We went full-stack with this one. FastAPI powers the backend because we needed streaming execution (Server-Sent Events for that sweet real-time feedback), and Next.js on the frontend because we wanted that buttery smooth graph editor experience. The testing nodes—fuzzer, prompt injection, validation—integrate directly into LangGraph workflows, so you're testing the actual thing, not some mock version.

Oh, and we added an "Attack Mode" because why stop at testing your own agents? Point it at any external API, inject some testing nodes, and see what happens. It's like Burp Suite but specifically designed for AI systems.

## What We Learned (The Hard Way)

Real-time streaming execution is *hard*. Getting those execution logs to flow smoothly from Python backend → FastAPI → Next.js frontend without dropping events took way more debugging than we'd like to admit. SSE is great until it isn't, and then you're reading MDN docs at 2 AM trying to figure out why your events aren't parsing correctly.

LLM integration was another adventure. We hooked up Ollama for the fuzzer node to generate adversarial prompts, which sounds simple until you realize you need to handle timeouts, model switching, token counting, and response streaming all while keeping the state graph flowing. The fuzzer now generates 50+ attack variants and logs everything to JSON/CSV for analysis.

The visual graph editor was surprisingly fun to build once we figured out the node drag-and-drop system. We added keyboard shortcuts, real-time node state updates, and this cool analysis panel that slides in automatically after execution with an AI-generated security report. Getting that UX to feel smooth—nodes lighting up as they execute, logs streaming in organized layers—took a lot of iteration.

## The Challenges

**State management across execution flows**: LangGraph's state handling is powerful but complex. Injecting testing nodes between existing nodes while preserving state keys and making sure everything flows correctly required deep diving into the LangGraph internals.

**The analysis feature**: We wanted AI-powered security analysis after every execution. This meant capturing all execution data, sending it to an LLM with a carefully crafted system prompt, parsing the response into risk scores and recommendations, and displaying it in a way that's actually useful. The first version just returned word salads. The current version actually catches real vulnerabilities.

**Making it user-friendly**: Security tools are notoriously hard to use. We obsessed over the UX—one-click graph loading, visual node directory you can drag from, automatic analysis panels, color-coded risk scores. The goal was "anyone can red-team their AI agent in 5 minutes" and we got pretty close.

## What's Cool About It

The fuzzer node runs 50+ attack variants against your prompts and logs every response with timestamps, token counts, and anomaly detection. The prompt injection node tries to extract system prompts using techniques from real attacks. The attack mode lets you test *external* APIs you don't even own (ethically, of course).

But the coolest part? It's all visual. You see your graph, you drag testing nodes onto it, you hit Execute, and you watch your agent workflow light up node by node while logs stream in real-time. When it's done, an AI security analysis pops up telling you exactly what went wrong and how to fix it. No terminal commands, no configuration files, just drag-drop-break-fix.

## What's Next

We're thinking batch testing (run 100 prompts through your fuzzer automatically), custom testing node builder (write your own attack strategies), and maybe some automated exploit generation because why not. The core platform is solid though—it works, it's fast, and it makes security testing actually *fun*.

If you're building AI agents and not security testing them, you're playing Russian roulette. This platform gives you the tools to find the vulnerabilities before someone else does. And honestly? Watching a fuzzer absolutely demolish your "secure" prompt handling is way more satisfying than it should be.

---

*Built with FastAPI, Next.js, LangGraph, and too much caffeine. Test responsibly.*

