// --------------------------------------------------------------------------------
// support-bubble.js - Explainer what this script file is about:
// --------------------------------------------------------------------------------
//
// This script adds a support bubble to your web application, allowing users
// to easily ask questions or report bugs by opening a pre-filled ChatGPT prompt.
//
// To include this support bubble in your application:
//
// 1. Copy this file (`support-bubble.js`) into your project.
// 2. Add the following script tag to your main HTML file, just before the
//    closing </body> tag:
//
//    <script src="support-bubble.js"></script>
//
// 3. (Optional) Define a global `BUG_REPORT_EMAIL` variable on the `window` object
//    to set a specific email address for bug reports:
//
//    <script>
//      window.BUG_REPORT_EMAIL = 'support@yourapp.com';
//    </script>
//    <script src="support-bubble.js"></script>
//
// --------------------------------------------------------------------------------
//
// To update the support bubble:
//
// 1. Download the latest version of `support-bubble.js`.
// 2. Replace the existing `support-bubble.js` file in your project with the new one.
//
// --------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  /**********************
   * HTML elements
   **********************/
  const bubbleHTML = `
    <button id="support-bubble" title="Ask a question or file a bug"
      class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md cursor-pointer z-50 hover:opacity-90 dark:bg-blue-400">
      <!-- simple chat icon (SVG) -->
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>`;

  const popoverHTML = `
    <div id="support-popover"
      class="fixed bottom-20 right-6 w-80 p-3 border border-gray-300 rounded-lg shadow-lg z-50 bg-white text-black hidden dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
      <textarea id="support-input" placeholder="Type your question or bug report…"
        class="w-full min-h-[80px] resize-y border border-gray-400 rounded p-1.5 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400"></textarea>
      <button id="support-send"
        class="mt-2 w-full py-2 rounded bg-blue-600 text-white text-sm hover:opacity-90 dark:bg-blue-400">Submit</button>
      <!-- Retry notice (shown only if popup is blocked) -->
      <div id="retry-notice" class="mt-2 text-xs text-gray-500 dark:text-gray-400 hidden">
        Pop‑up blocked. <a id="retry-link" href="#" class="underline">Open manually</a>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', bubbleHTML);
  document.body.insertAdjacentHTML('beforeend', popoverHTML);

  /**********************
   * Configuration
   **********************/
  const CHAR_LIMIT = 8000; // URL‑encoded length limit

  /**********************
   * Console log capture
   **********************/
  (function captureConsole() {
    const methods = ["log", "error", "warn", "info"];
    const buffer = [];
    methods.forEach(m => {
      const original = console[m];
      console[m] = function (...args) {
        try {
          const line = `[${m.toUpperCase()}] "${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}"`;
          buffer.push(line);
        } catch (_) {/* ignore serialization issues */ }
        original.apply(console, args);
      };
    });
    window.__supportLogs = buffer;
  })();

  /**********************
   * DOM references
   **********************/
  const bubble = document.getElementById('support-bubble');
  const popover = document.getElementById('support-popover');
  const textarea = document.getElementById('support-input');
  const sendBtn = document.getElementById('support-send');
  const retryNotice = document.getElementById('retry-notice');
  const retryLink = document.getElementById('retry-link');

  /**********************
   * UI behaviour
   **********************/
  function togglePopover() {
    const isHidden = popover.classList.contains('hidden');
    popover.classList.toggle('hidden', !isHidden);
    if (isHidden) {
      textarea.focus();
    }
  }

  bubble.addEventListener('click', togglePopover);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') popover.classList.add('hidden');
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') sendToChatGPT();
  });

  /**********************
   * Prompt builder
   **********************/
  function buildPrefix(pageUrl, bugEmail) {
    return `I am a user (not a developer) of ${pageUrl}.\n` +
      `Browse to that URL and inspect the page to understand my user-provided information & instructions below.\n\n` +
      `If my message below is a question about how to do something, answer it directly.\n\n` +
      `If my message appears to be a bug report or feature request:\n` +
      ` • Ask follow‑up questions one at a time until you have enough detail. For the answers of your questions provide numbered response suggestions to pick from. \n` +
      ` • Draft an email with the template below and instruct me to send it to ${bugEmail || '___BUG_REPORT_EMAIL___'}.\n` +
      ` • If BUG_REPORT_EMAIL is missing, try to discover a support email for the domain; if none is found, default to support@<domain>.\n\n` +
      `--- Email template ---\n` +
      `Subject: Bug report – <short title>\n\n` +
      `• TLDR Summary\n` +
      `• Detailed description\n` +
      `• Steps to reproduce\n` +
      `• Expected result\n` +
      `• Actual result\n` +
      `• Environment (browser, OS)\n` +
      `• Additional info / console log\n` +
      `----------------------\n\n` +
      `User-provided information & instructions:\n`;
  }

  function buildPrompt(userText) {
    const pageUrl = window.location.href; // full URL incl. query/hash
    const bugEmail = window.BUG_REPORT_EMAIL ?? '';
    const prefix = buildPrefix(pageUrl, bugEmail);

    const logLines = window.__supportLogs ?? [];          // array of strings
    let prompt     = `${prefix}${userText}`;

    if (logLines.length) {
      const chosen = [];                                  // newest-first buffer
      for (let i = logLines.length - 1; i >= 0; i--) {
        // Prepend the next-newest line
        chosen.unshift(logLines[i]);

        // Would the prompt (incl. "Console log:" header) now be too long?
        const candidate =
          `${prompt}\n\nConsole log:\n${chosen.join('\n')}`;
        if (encodeURIComponent(candidate).length > CHAR_LIMIT) {
          chosen.shift();                                 // undo last add
          break;
        }
      }

      if (chosen.length) {
        prompt += `\n\nConsole log:\n${chosen.join('\n')}`;
        if (chosen.length < logLines.length) prompt += '\n...'; // indicate truncation
      }
    }

    return prompt;
  }

  /**********************
   * ChatGPT launcher
   **********************/
  function showRetryNotice(url) {
    retryLink.href = url;
    retryNotice.classList.remove('hidden');
  }

  function sendToChatGPT() {
    const userText = textarea.value.trim();
    if (!userText) return;

    const prompt = buildPrompt(userText);
    const chatUrl = `https://chat.openai.com/?model=o3&q=${encodeURIComponent(prompt)}`;
    const popup = window.open(chatUrl, '_blank', 'noopener');

    if (popup === null) {
      showRetryNotice(chatUrl);
    } else {
      retryNotice.classList.add('hidden'); // hide previous notice if any
      textarea.value = '';
      popover.classList.add('hidden');
    }
  }

  sendBtn.addEventListener('click', sendToChatGPT);
});
