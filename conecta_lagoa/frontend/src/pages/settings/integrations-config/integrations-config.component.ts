import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';

interface ProviderDef {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'voice' | 'whatsapp' | 'boleto';
  icon: string;
  description: string;
  fields: { key: string; label: string; type: string; placeholder?: string; required?: boolean }[];
}

interface SavedIntegration {
  id: string;
  provider: string;
  channel: string;
  config: Record<string, any>;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_status: string | null;
}

@Component({
  selector: 'app-integrations-config',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <!-- Channel sections -->
    @for (channel of channels; track channel.id) {
      <div class="channel-section">
        <div class="channel-section__header">
          <span class="channel-section__icon">{{ channel.icon }}</span>
          <div>
            <h3 class="channel-section__title">{{ channel.label }}</h3>
            <p class="channel-section__desc">{{ channel.desc }}</p>
          </div>
        </div>

        <div class="provider-grid">
          @for (provider of getProviders(channel.id); track provider.id) {
            <div class="provider-card" [class.provider-card--active]="isActive(provider.id)" [class.provider-card--configured]="isConfigured(provider.id)">
              <div class="provider-card__header">
                <div class="provider-card__icon">{{ provider.icon }}</div>
                <div class="provider-card__info">
                  <div class="provider-card__name">{{ provider.name }}</div>
                  <div class="provider-card__desc">{{ provider.description }}</div>
                </div>
                <div class="provider-card__status">
                  @if (isActive(provider.id)) {
                    <span class="status-badge status-badge--active">Active</span>
                  } @else if (isConfigured(provider.id)) {
                    <span class="status-badge status-badge--configured">Configured</span>
                  }
                </div>
              </div>

              <div class="provider-card__actions">
                <button class="btn-sm" (click)="toggleConfig(provider.id)">
                  {{ expandedProvider() === provider.id ? 'Close' : 'Configure' }}
                </button>
                @if (isConfigured(provider.id)) {
                  <button class="btn-sm btn-sm--outline" (click)="testConnection(provider)" [disabled]="testing() === provider.id">
                    {{ testing() === provider.id ? 'Testing...' : 'Test' }}
                  </button>
                  @if (isActive(provider.id)) {
                    <button class="btn-sm btn-sm--danger" (click)="deactivate(provider.id)">Deactivate</button>
                  } @else {
                    <button class="btn-sm btn-sm--success" (click)="activate(provider.id)">Activate</button>
                  }
                }
              </div>

              <!-- Config Form -->
              @if (expandedProvider() === provider.id) {
                <div class="provider-config">
                  @for (field of provider.fields; track field.key) {
                    <div class="config-field">
                      <label>{{ field.label }}{{ field.required ? ' *' : '' }}</label>
                      @if (field.type === 'password') {
                        <input type="password" [(ngModel)]="configForms[provider.id][field.key]" [placeholder]="field.placeholder || ''" />
                      } @else if (field.type === 'number') {
                        <input type="number" [(ngModel)]="configForms[provider.id][field.key]" [placeholder]="field.placeholder || ''" />
                      } @else if (field.type === 'checkbox') {
                        <label class="checkbox-wrap"><input type="checkbox" [(ngModel)]="configForms[provider.id][field.key]" /> {{ field.label }}</label>
                      } @else if (field.type === 'select') {
                        <select [(ngModel)]="configForms[provider.id][field.key]">
                          <option value="us-east-1">us-east-1</option>
                          <option value="us-west-2">us-west-2</option>
                          <option value="eu-west-1">eu-west-1</option>
                          <option value="sa-east-1">sa-east-1</option>
                          <option value="ap-southeast-1">ap-southeast-1</option>
                        </select>
                      } @else {
                        <input type="text" [(ngModel)]="configForms[provider.id][field.key]" [placeholder]="field.placeholder || ''" />
                      }
                    </div>
                  }
                  <div class="provider-config__actions">
                    <button class="btn-primary-sm" (click)="saveConfig(provider)" [disabled]="saving()">Save Configuration</button>
                    @if (isConfigured(provider.id)) {
                      <button class="btn-danger-sm" (click)="removeConfig(provider.id)">Remove</button>
                    }
                  </div>

                  <!-- Test Result -->
                  @if (testResult() && testResult()!.provider === provider.id) {
                    <div class="test-result" [class.test-result--success]="testResult()!.success" [class.test-result--error]="!testResult()!.success">
                      <svg *ngIf="testResult()!.success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                      <svg *ngIf="!testResult()!.success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                      {{ testResult()!.message }}
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .channel-section { margin-bottom: 32px; }
    .channel-section__header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .channel-section__icon { font-size: 24px; }
    .channel-section__title { font-size: 17px; font-weight: 700; color: var(--text-primary); }
    .channel-section__desc { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

    .provider-grid { display: flex; flex-direction: column; gap: 12px; }

    .provider-card {
      background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-md);
      padding: 20px; transition: all 0.2s;
      &--active { border-color: var(--success); border-left: 3px solid var(--success); }
      &--configured:not(.provider-card--active) { border-color: var(--primary); border-left: 3px solid var(--primary); }
    }
    .provider-card__header { display: flex; align-items: center; gap: 16px; }
    .provider-card__icon { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--surface-ground); border-radius: var(--radius-sm); }
    .provider-card__info { flex: 1; }
    .provider-card__name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .provider-card__desc { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
    .provider-card__status { }
    .status-badge {
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 100px;
      &--active { background: rgba(16,185,129,0.1); color: #10b981; }
      &--configured { background: var(--primary-subtle); color: var(--primary); }
    }

    .provider-card__actions { display: flex; gap: 8px; margin-top: 16px; }

    .btn-sm {
      padding: 6px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600;
      cursor: pointer; border: 1px solid var(--border-color); background: var(--surface-card);
      color: var(--text-primary); font-family: inherit; transition: all 0.2s;
      &:hover { background: var(--surface-hover); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      &--outline { border-color: var(--primary); color: var(--primary); &:hover { background: var(--primary-subtle); } }
      &--success { border-color: var(--success); color: var(--success); &:hover { background: rgba(16,185,129,0.08); } }
      &--danger { border-color: var(--danger); color: var(--danger); &:hover { background: rgba(239,68,68,0.08); } }
    }

    .provider-config {
      margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .config-field {
      display: flex; flex-direction: column; gap: 6px;
      label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
      input, select {
        padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);
        font-size: 14px; font-family: inherit; background: var(--surface-ground); color: var(--text-primary); outline: none;
        &:focus { border-color: var(--primary); }
      }
      .checkbox-wrap { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; input { width: auto; } }
    }
    .provider-config__actions {
      grid-column: 1 / -1; display: flex; gap: 12px; margin-top: 8px;
    }
    .btn-primary-sm {
      padding: 8px 20px; background: var(--primary); color: white; border: none; border-radius: var(--radius-sm);
      font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      &:hover { background: var(--primary-hover); } &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-danger-sm {
      padding: 8px 20px; background: none; color: var(--danger); border: 1px solid var(--danger); border-radius: var(--radius-sm);
      font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      &:hover { background: rgba(239,68,68,0.08); }
    }

    .test-result {
      grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; padding: 10px 16px;
      border-radius: var(--radius-sm); font-size: 13px; margin-top: 8px;
      &--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; svg { color: #22c55e; } }
      &--error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; svg { color: #ef4444; } }
    }

    @media (max-width: 768px) { .provider-config { grid-template-columns: 1fr; } }
  `]
})
export class IntegrationsConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  savedIntegrations = signal<SavedIntegration[]>([]);
  expandedProvider = signal<string | null>(null);
  testing = signal<string | null>(null);
  saving = signal(false);
  testResult = signal<{ provider: string; success: boolean; message: string } | null>(null);

  configForms: Record<string, Record<string, any>> = {};

  channels = [
    { id: 'email', icon: '\u{1F4E7}', label: 'Email Providers', desc: 'Configure email delivery for collection notifications' },
    { id: 'sms', icon: '\u{1F4AC}', label: 'SMS Providers', desc: 'Configure SMS delivery for customer outreach' },
    { id: 'voice', icon: '\u{1F4DE}', label: 'Voice Message Providers', desc: 'Configure automated voice calls with text-to-speech for collections' },
    { id: 'whatsapp', icon: '\u{1F4F1}', label: 'WhatsApp Providers', desc: 'Configure WhatsApp messaging integration' },
    { id: 'boleto', icon: '\u{1F4C4}', label: 'Boletos de Cobrança', desc: 'Configure boleto/charge emission providers' },
  ];

  providers: ProviderDef[] = [
    {
      id: 'brevo', name: 'Brevo', channel: 'email', icon: '\u{1F171}\uFE0F',
      description: 'Formerly Sendinblue. Transactional email API.',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'xkeysib-...' },
        { key: 'senderName', label: 'Sender Name', type: 'text', required: true, placeholder: 'Acme Collections' },
        { key: 'senderEmail', label: 'Sender Email', type: 'text', required: true, placeholder: 'collections@acme.com' },
      ]
    },
    {
      id: 'resend', name: 'Resend', channel: 'email', icon: '\u{1F4E8}',
      description: 'Modern email API for developers.',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 're_...' },
        { key: 'fromEmail', label: 'From Email', type: 'text', required: true, placeholder: 'collections@yourdomain.com' },
        { key: 'fromName', label: 'From Name', type: 'text', required: true, placeholder: 'Collections Team' },
      ]
    },
    {
      id: 'ses', name: 'Amazon SES', channel: 'email', icon: '\u2601\uFE0F',
      description: 'AWS Simple Email Service.',
      fields: [
        { key: 'accessKeyId', label: 'Access Key ID', type: 'password', required: true },
        { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
        { key: 'region', label: 'Region', type: 'select', required: true },
        { key: 'fromEmail', label: 'From Email', type: 'text', required: true },
      ]
    },
    {
      id: 'smtp', name: 'SMTP', channel: 'email', icon: '\u{1F512}',
      description: 'Custom SMTP server or own DNS.',
      fields: [
        { key: 'host', label: 'Host', type: 'text', required: true, placeholder: 'smtp.yourdomain.com' },
        { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
        { key: 'secure', label: 'Use TLS', type: 'checkbox' },
        { key: 'username', label: 'Username', type: 'text', required: true },
        { key: 'password', label: 'Password', type: 'password', required: true },
        { key: 'fromEmail', label: 'From Email', type: 'text', required: true },
        { key: 'fromName', label: 'From Name', type: 'text', placeholder: 'Collections' },
      ]
    },
    {
      id: 'twilio', name: 'Twilio', channel: 'sms', icon: '\u{1F4F2}',
      description: 'Global SMS and voice API.',
      fields: [
        { key: 'accountSid', label: 'Account SID', type: 'text', required: true, placeholder: 'AC...' },
        { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
        { key: 'fromNumber', label: 'From Number', type: 'text', required: true, placeholder: '+1234567890' },
      ]
    },
    {
      id: 'zenvia', name: 'Zenvia', channel: 'voice', icon: '\u{1F50A}',
      description: 'Brazilian CPaaS — automated voice calls with AI text-to-speech.',
      fields: [
        { key: 'apiToken', label: 'API Token (X-API-Token)', type: 'password', required: true, placeholder: 'Your Zenvia platform token' },
        { key: 'senderId', label: 'Sender ID', type: 'text', required: true, placeholder: 'Registered phone number or alias' },
        { key: 'voiceStyle', label: 'TTS Voice Style', type: 'text', placeholder: 'br-Vitoria (default)' },
      ]
    },
    {
      id: 'chatwoot', name: 'Chatwoot', channel: 'whatsapp', icon: '\u{1F49A}',
      description: 'Open-source customer messaging platform.',
      fields: [
        { key: 'baseUrl', label: 'Base URL', type: 'text', required: true, placeholder: 'https://app.chatwoot.com' },
        { key: 'apiToken', label: 'API Token', type: 'password', required: true },
        { key: 'accountId', label: 'Account ID', type: 'text', required: true },
        { key: 'inboxId', label: 'Inbox ID', type: 'text', required: true },
      ]
    },
    {
      id: 'axia_bank', name: 'Axia Bank', channel: 'boleto', icon: '\u{1F3E6}',
      description: 'Axia Bank boleto and charge emission via banking API.',
      fields: [
        { key: 'authorization', label: 'Authorization (Basic)', type: 'password', required: true, placeholder: 'Basic auth token' },
        { key: 'receiverAccount', label: 'Receiver Account', type: 'text', required: true, placeholder: 'Numbers only' },
        { key: 'receiverDocument', label: 'Receiver Document (CPF/CNPJ)', type: 'text', required: true, placeholder: 'Numbers only' },
        { key: 'expirationAfterPayment', label: 'Expiration After Payment (days)', type: 'number', placeholder: '0' },
        { key: 'finePercent', label: 'Fine %', type: 'number', placeholder: '2' },
        { key: 'interestPercent', label: 'Interest %', type: 'number', placeholder: '1' },
        { key: 'discountAmount', label: 'Discount Amount', type: 'number', placeholder: '0' },
        { key: 'discountModality', label: 'Discount Modality', type: 'text', placeholder: 'FIXED or PERCENTAGE' },
        { key: 'discountLimitDate', label: 'Discount Limit Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      ]
    },
  ];

  ngOnInit(): void {
    this.initForms();
    this.loadIntegrations();
  }

  initForms(): void {
    for (const p of this.providers) {
      this.configForms[p.id] = {};
      for (const f of p.fields) {
        this.configForms[p.id][f.key] = f.type === 'checkbox' ? false : '';
      }
    }
  }

  loadIntegrations(): void {
    this.api.get<any>('/core/integrations').subscribe({
      next: (res) => {
        this.savedIntegrations.set(res.data || []);
        // Populate forms with saved configs
        for (const saved of this.savedIntegrations()) {
          if (this.configForms[saved.provider]) {
            Object.entries(saved.config).forEach(([k, v]) => {
              this.configForms[saved.provider][k] = v;
            });
          }
        }
      },
      error: () => {}
    });
  }

  getProviders(channel: string): ProviderDef[] {
    return this.providers.filter(p => p.channel === channel);
  }

  isConfigured(providerId: string): boolean {
    return this.savedIntegrations().some(i => i.provider === providerId);
  }

  isActive(providerId: string): boolean {
    return this.savedIntegrations().some(i => i.provider === providerId && i.is_active);
  }

  toggleConfig(providerId: string): void {
    this.expandedProvider.set(this.expandedProvider() === providerId ? null : providerId);
    this.testResult.set(null);
  }

  saveConfig(provider: ProviderDef): void {
    this.saving.set(true);
    this.api.post<any>('/core/integrations', {
      provider: provider.id,
      channel: provider.channel,
      config: this.configForms[provider.id],
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadIntegrations();
        this.toast.success(`${provider.name} configuration saved`);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Failed to save configuration');
      }
    });
  }

  testConnection(provider: ProviderDef): void {
    this.testing.set(provider.id);
    this.testResult.set(null);
    this.api.post<any>(`/core/integrations/${provider.id}/test`, {}).subscribe({
      next: (res) => {
        this.testing.set(null);
        this.testResult.set({ provider: provider.id, ...res.data });
      },
      error: () => {
        this.testing.set(null);
        this.testResult.set({ provider: provider.id, success: false, message: 'Connection test failed' });
      }
    });
  }

  activate(providerId: string): void {
    this.api.post<any>(`/core/integrations/${providerId}/activate`, {}).subscribe({
      next: () => {
        this.loadIntegrations();
        this.toast.success('Provider activated');
      },
      error: () => this.toast.error('Failed to activate')
    });
  }

  deactivate(providerId: string): void {
    this.api.post<any>(`/core/integrations/${providerId}/deactivate`, {}).subscribe({
      next: () => {
        this.loadIntegrations();
        this.toast.warning('Provider deactivated');
      },
      error: () => this.toast.error('Failed to deactivate')
    });
  }

  removeConfig(providerId: string): void {
    this.toast.confirm({
      title: 'Remove Integration',
      message: 'Are you sure you want to remove this integration configuration?',
      confirmLabel: 'Remove',
      variant: 'danger',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete<any>(`/core/integrations/${providerId}`).subscribe({
        next: () => {
          this.loadIntegrations();
          this.expandedProvider.set(null);
          this.toast.success('Configuration removed');
        },
        error: () => this.toast.error('Failed to remove')
      });
    });
  }
}
