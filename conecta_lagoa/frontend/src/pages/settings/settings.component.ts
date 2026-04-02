import { Component, signal, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceConfigComponent } from './workspace-config/workspace-config.component';
import { TaskTemplatesComponent } from './task-templates/task-templates.component';
import { IntegrationsConfigComponent } from './integrations-config/integrations-config.component';
import { CalculatedAttributesComponent } from './calculated-attributes/calculated-attributes.component';
import { BillingComponent } from './billing/billing.component';
import { CustomFieldsComponent } from './custom-fields/custom-fields.component';
import { TeamComponent } from './team/team.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    TranslateModule,
    WorkspaceConfigComponent,
    TaskTemplatesComponent,
    IntegrationsConfigComponent,
    CalculatedAttributesComponent,
    BillingComponent,
    CustomFieldsComponent,
    TeamComponent,
  ],
  template: `
    <div class="animate-fade-in">
      <div class="page-header">
        <h1 class="page-header__title">{{ 'SETTINGS_PAGE.TITLE' | translate }}</h1>
        <p class="page-header__subtitle">{{ 'SETTINGS_PAGE.SUBTITLE' | translate }}</p>
      </div>

      <mat-tab-group animationDuration="200ms">
        <mat-tab [label]="'SETTINGS_PAGE.GENERAL' | translate">
          <div class="settings__tab card mt-lg">
            <h3 class="card__title mb-lg">{{ 'SETTINGS_PAGE.ORG_SETTINGS' | translate }}</h3>
            <div class="grid grid--2 mb-lg">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'SETTINGS_PAGE.ORG_NAME' | translate }}</mat-label>
                <input matInput [(ngModel)]="orgName" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'SETTINGS_PAGE.DEFAULT_CURRENCY' | translate }}</mat-label>
                <mat-select [(ngModel)]="currency">
                  <mat-option value="USD">USD - US Dollar</mat-option>
                  <mat-option value="EUR">EUR - Euro</mat-option>
                  <mat-option value="GBP">GBP - British Pound</mat-option>
                  <mat-option value="BRL">BRL - Brazilian Real</mat-option>
                  <mat-option value="ARS">ARS - Argentine Peso</mat-option>
                  <mat-option value="CLP">CLP - Chilean Peso</mat-option>
                  <mat-option value="COP">COP - Colombian Peso</mat-option>
                  <mat-option value="MXN">MXN - Mexican Peso</mat-option>
                  <mat-option value="PEN">PEN - Peruvian Sol</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <div class="grid grid--2 mb-lg">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'SETTINGS_PAGE.TIMEZONE' | translate }}</mat-label>
                <mat-select [(ngModel)]="timezone">
                  <mat-option value="UTC">UTC</mat-option>
                  <mat-option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</mat-option>
                  <mat-option value="America/Argentina/Buenos_Aires">America/Buenos_Aires (ART)</mat-option>
                  <mat-option value="America/Santiago">America/Santiago (CLT)</mat-option>
                  <mat-option value="America/Bogota">America/Bogota (COT)</mat-option>
                  <mat-option value="America/Mexico_City">America/Mexico_City (CST)</mat-option>
                  <mat-option value="America/Lima">America/Lima (PET)</mat-option>
                  <mat-option value="US/Eastern">US/Eastern (EST)</mat-option>
                  <mat-option value="US/Pacific">US/Pacific (PST)</mat-option>
                  <mat-option value="Europe/London">Europe/London (GMT)</mat-option>
                  <mat-option value="Europe/Madrid">Europe/Madrid (CET)</mat-option>
                  <mat-option value="Europe/Lisbon">Europe/Lisbon (WET)</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'SETTINGS_PAGE.DATE_FORMAT' | translate }}</mat-label>
                <mat-select [(ngModel)]="dateFormat">
                  <mat-option value="DD/MM/YYYY">DD/MM/YYYY</mat-option>
                  <mat-option value="MM/DD/YYYY">MM/DD/YYYY</mat-option>
                  <mat-option value="YYYY-MM-DD">YYYY-MM-DD</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <button mat-flat-button color="primary" (click)="saveGeneralSettings()">{{ 'SETTINGS_PAGE.SAVE_CHANGES' | translate }}</button>
          </div>
        </mat-tab>

        <mat-tab [label]="'TEAM.TAB_TITLE' | translate">
          <div class="settings__tab mt-lg" style="max-width: 900px;">
            <app-team />
          </div>
        </mat-tab>

        <mat-tab [label]="'SETTINGS_PAGE.NOTIFICATIONS_TAB' | translate">
          <div class="settings__tab card mt-lg">
            <h3 class="card__title mb-lg">{{ 'SETTINGS_PAGE.NOTIF_TITLE' | translate }}</h3>
            <div class="settings__toggle-list">
              <div class="settings__toggle-item">
                <div>
                  <div class="font-semibold">{{ 'SETTINGS_PAGE.NOTIF_EMAIL' | translate }}</div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ 'SETTINGS_PAGE.NOTIF_EMAIL_DESC' | translate }}</div>
                </div>
                <mat-slide-toggle [(ngModel)]="notifEmail" />
              </div>
              <mat-divider />
              <div class="settings__toggle-item">
                <div>
                  <div class="font-semibold">{{ 'SETTINGS_PAGE.NOTIF_TASKS' | translate }}</div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ 'SETTINGS_PAGE.NOTIF_TASKS_DESC' | translate }}</div>
                </div>
                <mat-slide-toggle [(ngModel)]="notifTasks" />
              </div>
              <mat-divider />
              <div class="settings__toggle-item">
                <div>
                  <div class="font-semibold">{{ 'SETTINGS_PAGE.NOTIF_SCENARIOS' | translate }}</div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ 'SETTINGS_PAGE.NOTIF_SCENARIOS_DESC' | translate }}</div>
                </div>
                <mat-slide-toggle [(ngModel)]="notifScenarios" />
              </div>
              <mat-divider />
              <div class="settings__toggle-item">
                <div>
                  <div class="font-semibold">{{ 'SETTINGS_PAGE.NOTIF_PAYMENTS' | translate }}</div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ 'SETTINGS_PAGE.NOTIF_PAYMENTS_DESC' | translate }}</div>
                </div>
                <mat-slide-toggle [(ngModel)]="notifPayments" />
              </div>
              <mat-divider />
              <div class="settings__toggle-item">
                <div>
                  <div class="font-semibold">{{ 'SETTINGS_PAGE.NOTIF_AI' | translate }}</div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ 'SETTINGS_PAGE.NOTIF_AI_DESC' | translate }}</div>
                </div>
                <mat-slide-toggle [(ngModel)]="notifAI" />
              </div>
            </div>
            <button mat-flat-button color="primary" class="mt-lg" (click)="saveNotificationPrefs()">{{ 'COMMON.SAVE' | translate }}</button>
          </div>
        </mat-tab>

        <mat-tab [label]="'SETTINGS_PAGE.INTEGRATIONS' | translate">
          <div class="settings__tab mt-lg" style="max-width: 900px;">
            <app-integrations-config />
          </div>
        </mat-tab>

        <mat-tab [label]="'SETTINGS_PAGE.API_KEYS' | translate">
          <div class="settings__tab card mt-lg">
            <h3 class="card__title mb-lg">{{ 'SETTINGS_PAGE.API_KEYS_TITLE' | translate }}</h3>
            <p class="text-sm mb-lg" style="color: var(--text-secondary)">{{ 'SETTINGS_PAGE.API_KEYS_DESC' | translate }}</p>
            <button mat-flat-button color="primary" (click)="generateApiKey()">
              <mat-icon>add</mat-icon>
              {{ 'SETTINGS_PAGE.GENERATE_KEY' | translate }}
            </button>
            @if (apiKeys().length > 0) {
              <div class="settings__api-keys mt-lg">
                @for (key of apiKeys(); track key) {
                  <div class="settings__api-key-item">
                    <code class="settings__api-key-value">{{ key }}</code>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab [label]="'WORKSPACE_CONFIG.TAB_TITLE' | translate">
          <div class="settings__tab mt-lg" style="max-width: 900px;">
            <app-workspace-config />
          </div>
        </mat-tab>

        <mat-tab [label]="'TASK_TEMPLATES.TAB_TITLE' | translate">
          <div class="settings__tab mt-lg" style="max-width: 900px;">
            <app-task-templates />
          </div>
        </mat-tab>

        <mat-tab [label]="'CALCULATED_ATTRS.TAB_TITLE' | translate">
          <div class="settings__tab mt-lg" style="max-width: 900px;">
            <app-calculated-attributes />
          </div>
        </mat-tab>

        <mat-tab [label]="'CUSTOM_FIELDS.TAB_TITLE' | translate">
          <div class="settings__tab mt-lg" style="max-width: 900px;">
            <app-custom-fields />
          </div>
        </mat-tab>

        <mat-tab [label]="'BILLING.TITLE' | translate">
          <div class="settings__tab mt-lg" style="max-width: 960px;">
            <app-billing />
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .settings {
      &__tab {
        max-width: 800px;
      }

      &__toggle-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      &__toggle-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 0;
      }

      &__integration-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      &__integration {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
      }

      &__integration-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      &__integration-info {
        flex: 1;
      }

      &__api-keys {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      &__api-key-item {
        padding: 12px 16px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: var(--surface-hover);
      }

      &__api-key-value {
        font-size: 13px;
        word-break: break-all;
      }

    }
  `],
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  orgName = '';
  currency = 'USD';
  timezone = 'UTC';
  dateFormat = 'MM/DD/YYYY';

  notifEmail = true;
  notifTasks = true;
  notifScenarios = true;
  notifPayments = true;
  notifAI = false;

  apiKeys = signal<string[]>([]);

  ngOnInit(): void {
    this.loadTenantSettings();
  }

  private loadTenantSettings(): void {
    this.api.get<{ success: boolean; data: any }>('/core/tenant').subscribe({
      next: (res) => {
        const tenant = res.data;
        if (tenant) {
          this.orgName = tenant.name || '';
          this.currency = tenant.currency || 'USD';
          this.timezone = tenant.timezone || 'UTC';
          this.dateFormat = tenant.dateFormat || 'MM/DD/YYYY';
          if (tenant.notifications) {
            this.notifEmail = tenant.notifications.email ?? true;
            this.notifTasks = tenant.notifications.tasks ?? true;
            this.notifScenarios = tenant.notifications.scenarios ?? true;
            this.notifPayments = tenant.notifications.payments ?? true;
            this.notifAI = tenant.notifications.ai ?? false;
          }
          // Explicitly trigger CD to avoid NG0100 when values change
          // during the same cycle as the initial render
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Keep defaults on error
      },
    });
  }

  saveGeneralSettings(): void {
    this.api.patch<{ success: boolean }>('/core/tenant/settings', {
      name: this.orgName,
      currency: this.currency,
      timezone: this.timezone,
      dateFormat: this.dateFormat,
    }).subscribe({
      next: () => this.snackBar.open(this.translate.instant('SETTINGS_PAGE.SETTINGS_SAVED'), 'OK', { duration: 3000 }),
      error: () => this.snackBar.open(this.translate.instant('SETTINGS_PAGE.SETTINGS_SAVE_ERROR'), 'OK', { duration: 3000 }),
    });
  }

  saveNotificationPrefs(): void {
    this.api.patch<{ success: boolean }>('/core/tenant/settings', {
      notifications: {
        email: this.notifEmail,
        tasks: this.notifTasks,
        scenarios: this.notifScenarios,
        payments: this.notifPayments,
        ai: this.notifAI,
      },
    }).subscribe({
      next: () => this.snackBar.open(this.translate.instant('SETTINGS_PAGE.NOTIF_SAVED'), 'OK', { duration: 3000 }),
      error: () => this.snackBar.open(this.translate.instant('SETTINGS_PAGE.NOTIF_SAVE_ERROR'), 'OK', { duration: 3000 }),
    });
  }

  generateApiKey(): void {
    const key = crypto.randomUUID();
    this.apiKeys.update((keys) => [...keys, key]);
    this.snackBar.open(this.translate.instant('SETTINGS_PAGE.KEY_GENERATED'), 'OK', { duration: 5000 });
  }
}
