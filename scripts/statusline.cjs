const fs = require('fs');

try {
  let raw = fs.readFileSync(0, 'utf-8');
  if (!raw) process.exit(0);

  raw = raw.replace(/^﻿/, '').trim();
  if (!raw) process.exit(0);

  const data = JSON.parse(raw);

  // 1. Context window
  const ctx = data.context_window || {};
  const used = ctx.total_input_tokens ?? data.total_input_tokens ?? 0;
  const max = ctx.context_window_size ?? 200000;
  const ctxPct = ctx.used_percentage ?? (max > 0 ? Math.round((used / max) * 100) : 0);

  // 2. Cache tokens & hit ratio
  const cache = data.cache_read_input_tokens
    ?? ctx.cache_read_input_tokens
    ?? ctx.current_usage?.cache_read_input_tokens
    ?? 0;

  const cachePct = used > 0 ? Math.min(100, Math.round((cache / used) * 100)) : 0;

  // 3. Accumulated session cost
  const cost = data.cost?.total_cost_usd
    ?? data.cost_usd
    ?? data.cost?.usd
    ?? 0;

  // 4. Model & estimated next prompt submission cost
  const modelId = (data.model?.id || data.model?.display_name || '').toLowerCase();
  let cacheRate = 0.30 / 1000000;   // default Sonnet: $0.30/M cache read
  let inputRate = 3.00 / 1000000;   // default Sonnet: $3.00/M new input

  if (modelId.includes('opus') || modelId.includes('antigravity')) {
    cacheRate = 1.50 / 1000000;     // Opus: $1.50/M cache read
    inputRate = 15.00 / 1000000;    // Opus: $15.00/M new input
  } else if (modelId.includes('haiku') || modelId.includes('astra')) {
    cacheRate = 0.03 / 1000000;     // Haiku: $0.03/M cache read
    inputRate = 0.25 / 1000000;     // Haiku: $0.25/M new input
  }

  // Estimated next turn input cost (cached context + ~500 new prompt tokens)
  const cachedPart = cache > 0 ? cache : Math.round(used * 0.9);
  const uncachedPart = Math.max(0, used - cachedPart) + 500;
  const estPromptCost = (cachedPart * cacheRate) + (uncachedPart * inputRate);

  // Formatting helpers
  const fmtK = (n) => {
    if (n >= 1000) {
      const k = n / 1000;
      return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return `${n}`;
  };

  // ANSI styling
  const dim = '\x1b[90m';
  const cyan = '\x1b[36m';
  const green = '\x1b[32m';
  const yellow = '\x1b[33m';
  const magenta = '\x1b[35m';
  const red = '\x1b[31m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';

  const sep = `${dim} │ ${reset}`;

  // Ctx pill
  const ctxColor = ctxPct >= 80 ? red : ctxPct >= 60 ? yellow : green;
  const ctxPart = `${cyan}${bold}ctx${reset} ${fmtK(used)}${dim}/${fmtK(max)}${reset} ${ctxColor}(${ctxPct}%)${reset}`;

  // Modern progress bar for cache (8 blocks)
  const barWidth = 8;
  const filled = Math.round((cachePct / 100) * barWidth);
  const empty = barWidth - filled;
  const barColor = cachePct >= 70 ? green : cachePct >= 40 ? yellow : dim;
  const progressBar = `${barColor}${'█'.repeat(filled)}${dim}${'░'.repeat(empty)}${reset}`;
  const cachePart = `${green}${bold}cache${reset} [${progressBar}] ${barColor}${cachePct}%${reset} ${dim}(${fmtK(cache)})${reset}`;

  // Session cost pill
  const costPart = `${yellow}${bold}cost${reset} $${Number(cost).toFixed(3)}`;

  // Prompt cost estimate
  const promptPart = `${magenta}${bold}est prompt${reset} ${dim}~${reset}$${estPromptCost.toFixed(3)}`;

  // Strip ANSI to measure printable characters
  const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');

  const left = `${ctxPart}${sep}${cachePart}${sep}${costPart}`;
  const cols = process.stdout.columns || parseInt(process.env.COLUMNS, 10) || 0;

  let output = '';
  if (cols > 75) {
    const leftLen = stripAnsi(left).length;
    const rightLen = stripAnsi(promptPart).length;
    const pad = Math.max(2, cols - leftLen - rightLen - 1);
    output = `${left}${' '.repeat(pad)}${promptPart}\n`;
  } else {
    output = `${left}${sep}${promptPart}\n`;
  }

  process.stdout.write(output);
} catch {
  process.exit(0);
}
