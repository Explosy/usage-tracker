import type { UsageData } from '@shared/types';
import './style.css';

const api = window.usageTracker;

const card = document.querySelector('.card') as HTMLElement;

const setupEl = document.getElementById('setup')!;
const dashboardEl = document.getElementById('dashboard')!;
const keyForm = document.getElementById('key-form') as HTMLFormElement;
const keyInput = document.getElementById('key-input') as HTMLInputElement;
const setupError = document.getElementById('setup-error')!;
const usageList = document.getElementById('usage-list')!;
const emptyEl = document.getElementById('empty')!;
const refreshBtn = document.getElementById('refresh-btn')!;
const settingsBtn = document.getElementById('settings-btn')!;
const hotkeyHint = document.getElementById('hotkey-hint')!;

function show(view: 'setup' | 'dashboard'): void {
  setupEl.classList.toggle('hidden', view !== 'setup');
  dashboardEl.classList.toggle('hidden', view !== 'dashboard');
  syncSize();
}

function syncSize(): void {
  void api.resize(Math.ceil(card.getBoundingClientRect().height));
}

const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6
});
const plainFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6
});

function fmtMoney(value: number, currency: string): string {
  return currency === 'USD' ? usdFmt.format(value) : `${plainFmt.format(value)} ${currency}`;
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderUsage(items: UsageData[]): void {
  usageList.innerHTML = '';
  emptyEl.classList.toggle('hidden', items.length > 0);

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'provider';

    const head = document.createElement('div');
    head.className = 'row';
    head.innerHTML = `<span class="name">${item.providerName}</span>`;
    row.appendChild(head);

    if (item.error) {
      const err = document.createElement('p');
      err.className = 'error';
      err.textContent = item.error;
      row.appendChild(err);
    } else if (item.usage !== null) {
      const usage = document.createElement('p');
      usage.className = 'usage';
      usage.textContent = fmtMoney(item.usage, item.currency);
      row.appendChild(usage);

      const meta = document.createElement('p');
      meta.className = 'muted small';
      const parts: string[] = [];
      if (item.limit !== null) parts.push(`limit ${fmtMoney(item.limit, item.currency)}`);
      if (item.limitRemaining !== null)
        parts.push(`left ${fmtMoney(item.limitRemaining, item.currency)}`);
      meta.textContent = parts.join(' · ') || 'no credit limit';
      row.appendChild(meta);

      if (item.limit !== null && item.limit > 0) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = `${Math.min(100, (item.usage / item.limit) * 100).toFixed(1)}%`;
        bar.appendChild(fill);
        row.appendChild(bar);
      }
    }

    const time = document.createElement('p');
    time.className = 'muted small';
    time.textContent = `updated ${fmtTime(item.updatedAt)}`;
    row.appendChild(time);

    usageList.appendChild(row);
  }

  syncSize();
}

async function refresh(): Promise<void> {
  refreshBtn.classList.add('spin');
  try {
    renderUsage(await api.refresh());
  } finally {
    refreshBtn.classList.remove('spin');
  }
}

keyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setupError.textContent = '';
  const button = keyForm.querySelector('button')!;
  button.disabled = true;
  try {
    const result = await api.setApiKey('openrouter', keyInput.value);
    if (result.ok) {
      keyInput.value = '';
      show('dashboard');
      renderUsage(await api.refresh());
    } else {
      setupError.textContent = result.error;
      syncSize();
    }
  } finally {
    button.disabled = false;
  }
});

refreshBtn.addEventListener('click', () => void refresh());
settingsBtn.addEventListener('click', () => show('setup'));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') void api.hide();
});

api.onUsage(renderUsage);

void api.getState().then((state) => {
  hotkeyHint.textContent = `${state.hotkey} to toggle`;
  if (state.configured) {
    show('dashboard');
    renderUsage(state.usage);
    void refresh();
  } else {
    show('setup');
    keyInput.focus();
  }
});
