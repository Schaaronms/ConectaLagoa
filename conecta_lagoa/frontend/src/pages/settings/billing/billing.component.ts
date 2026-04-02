import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

interface PlanEntitlement {
  feature_key: string;
  entitlement_type: string;
  value_limit: number | null;
  value_boolean: boolean | null;
  value_tier: string | null;
}

interface PriceMapping {
  billing_cycle: string;
  currency: string;
  amount: number;
  stripe_price_id: string | null;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_free: boolean;
  display_order: number;
  entitlements: PlanEntitlement[];
  prices: PriceMapping[];
}

interface SubscriptionInfo {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string | null;
  currency: string | null;
  payment_method_type: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  pending_downgrade_plan_id: string | null;
  pending_upgrade_plan_id: string | null;
  plan: { id: string; name: string; slug: string; is_free: boolean };
  usage: Record<string, { current: number; limit: number | null; percentage: number | null }>;
}

interface UsageGauge {
  labelKey: string;
  icon: string;
  current: number;
  limit: number | null;
  percentage: number;
  color: string;
}

interface BillingEventRow {
  event_type: string;
  entity_id: string;
  quantity: number;
  created_at: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatButtonToggleModule,
    TranslateModule,
  ],
  template: `
    <div class="billing">
      <!-- Current Plan Banner -->
      <div class="billing__current-plan">
        <div class="billing__plan-gradient" [class]="'billing__plan-gradient--' + (subscription()?.plan?.slug || 'free')">
          <div class="billing__plan-badge">{{ 'BILLING.CURRENT_PLAN' | translate }}</div>
          <h2 class="billing__plan-title">{{ subscription()?.plan?.name || 'Free' }}</h2>
          <p class="billing__plan-price">{{ getCurrentPriceDisplay() }}</p>
          <p class="billing__plan-desc">{{ getPlanDescription() }}</p>
          @if (subscription()?.status === 'SUSPENDED') {
            <div class="billing__plan-alert billing__plan-alert--error">
              <mat-icon>error</mat-icon>
              {{ 'BILLING.ACCOUNT_SUSPENDED' | translate }}
            </div>
          } @else if (subscription()?.status === 'PAST_DUE') {
            <div class="billing__plan-alert billing__plan-alert--warning">
              <mat-icon>warning</mat-icon>
              {{ 'BILLING.PAYMENT_PAST_DUE' | translate }}
            </div>
          } @else if (subscription()?.pending_upgrade_plan_id) {
            <div class="billing__plan-alert billing__plan-alert--info">
              <mat-icon>hourglass_top</mat-icon>
              {{ 'BILLING.PENDING_PAYMENT' | translate }}
            </div>
          } @else if (subscription()?.pending_downgrade_plan_id) {
            <div class="billing__plan-alert billing__plan-alert--info">
              <mat-icon>info</mat-icon>
              {{ 'BILLING.PENDING_DOWNGRADE' | translate }}
            </div>
          }
          @if (subscription()?.current_period_end) {
            <p class="billing__plan-period">
              {{ 'BILLING.NEXT_BILLING' | translate }}: {{ subscription()!.current_period_end | date:'mediumDate' }}
            </p>
          }
        </div>
      </div>

      <!-- Usage Gauges -->
      <div class="billing__section">
        <h3 class="billing__section-title">
          <mat-icon>analytics</mat-icon>
          {{ 'BILLING.USAGE' | translate }}
        </h3>
        <div class="billing__gauges-grid">
          @for (gauge of usageGauges(); track gauge.labelKey) {
            <div class="billing__gauge-card">
              <div class="billing__gauge-icon-wrap" [style.background]="getGaugeIconBg(gauge)">
                <mat-icon [style.color]="getGaugeIconColor(gauge)">{{ gauge.icon }}</mat-icon>
              </div>
              <div class="billing__gauge-content">
                <div class="billing__gauge-label">{{ gauge.labelKey | translate }}</div>
                <div class="billing__gauge-value">
                  {{ gauge.current | number }}
                  <span class="billing__gauge-limit">
                    / {{ gauge.limit === null ? ('BILLING.UNLIMITED' | translate) : (gauge.limit | number) }}
                  </span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="gauge.limit === null ? 0 : gauge.percentage"
                  [color]="gauge.color === 'red' ? 'warn' : (gauge.color === 'amber' ? 'accent' : 'primary')"
                ></mat-progress-bar>
                @if (gauge.percentage >= 95 && gauge.limit !== null) {
                  <div class="billing__gauge-warning billing__gauge-warning--critical">
                    <mat-icon>warning</mat-icon>
                    {{ 'BILLING.LIMIT_REACHED' | translate }}
                  </div>
                } @else if (gauge.percentage >= 80 && gauge.limit !== null) {
                  <div class="billing__gauge-warning billing__gauge-warning--warn">
                    <mat-icon>info</mat-icon>
                    {{ 'BILLING.LIMIT_WARNING' | translate }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Plan Comparison -->
      <div class="billing__section">
        <h3 class="billing__section-title">
          <mat-icon>compare</mat-icon>
          {{ 'BILLING.CHOOSE_PLAN' | translate }}
        </h3>

        <!-- Billing Cycle & Currency toggles -->
        <div class="billing__toggles">
          <mat-button-toggle-group [value]="selectedCycle()" (change)="selectedCycle.set($event.value)">
            <mat-button-toggle value="monthly">{{ 'BILLING.MONTHLY' | translate }}</mat-button-toggle>
            <mat-button-toggle value="annual">
              {{ 'BILLING.ANNUAL' | translate }}
              <span class="billing__discount-badge">-5%</span>
            </mat-button-toggle>
          </mat-button-toggle-group>
          <mat-button-toggle-group [value]="selectedCurrency()" (change)="selectedCurrency.set($event.value)">
            <mat-button-toggle value="brl">R$ BRL</mat-button-toggle>
            <mat-button-toggle value="usd">$ USD</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <div class="billing__plans-grid">
          @for (plan of plans(); track plan.id) {
            <div class="billing__plan-card"
              [class.billing__plan-card--active]="plan.id === subscription()?.plan_id"
              [class.billing__plan-card--popular]="plan.slug === 'growth'">
              @if (plan.slug === 'growth') {
                <div class="billing__plan-popular-badge">{{ 'BILLING.POPULAR' | translate }}</div>
              }
              <div class="billing__plan-card-header" [class]="'billing__plan-card-header--' + plan.slug">
                <h4 class="billing__plan-card-name">{{ plan.name }}</h4>
                <div class="billing__plan-card-price">{{ getPlanPrice(plan) }}</div>
              </div>
              <div class="billing__plan-card-body">
                <ul class="billing__plan-features">
                  @for (feat of getPlanFeatureList(plan); track feat) {
                    <li>
                      <mat-icon class="billing__plan-check">check_circle</mat-icon>
                      {{ feat }}
                    </li>
                  }
                </ul>
                @if (plan.id === subscription()?.plan_id) {
                  <button mat-stroked-button disabled class="billing__plan-btn">
                    {{ 'BILLING.CURRENT' | translate }}
                  </button>
                } @else if (plan.slug === 'enterprise') {
                  <button mat-flat-button class="billing__plan-btn billing__plan-btn--enterprise" (click)="onContactSales()">
                    <mat-icon>mail</mat-icon>
                    {{ 'BILLING.CONTACT_SALES' | translate }}
                  </button>
                } @else if (plan.is_free) {
                  @if (isDowngrade(plan)) {
                    <button mat-stroked-button color="warn" class="billing__plan-btn" (click)="onDowngrade(plan)">
                      {{ 'BILLING.DOWNGRADE' | translate }}
                    </button>
                  }
                } @else if (isUpgrade(plan)) {
                  <div class="billing__payment-actions">
                    <button mat-flat-button color="primary" class="billing__plan-btn" (click)="onSubscribe(plan, 'card')">
                      <mat-icon>credit_card</mat-icon>
                      {{ 'BILLING.PAY_CARD' | translate }}
                    </button>
                  </div>
                } @else {
                  <button mat-stroked-button color="warn" class="billing__plan-btn" (click)="onDowngrade(plan)">
                    {{ 'BILLING.DOWNGRADE' | translate }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- PIX Modal -->
      @if (pixModalOpen()) {
        <div class="billing__modal-backdrop" (click)="closePixModal()">
          <div class="billing__modal" (click)="$event.stopPropagation()">
            <div class="billing__modal-header">
              <h3>{{ 'BILLING.PIX_PAYMENT' | translate }}</h3>
              <button mat-icon-button (click)="closePixModal()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="billing__modal-body">
              @if (pixLoading()) {
                <div class="billing__pix-loading">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>{{ 'BILLING.GENERATING_PIX' | translate }}</p>
                </div>
              } @else {
                <div class="billing__pix-content">
                  @if (pixData()?.qrCode) {
                    <img [src]="pixData()!.qrCode" alt="PIX QR Code" class="billing__pix-qr" />
                  } @else {
                    <div class="billing__pix-qr-placeholder">
                      <mat-icon>qr_code_2</mat-icon>
                      <span>QR Code</span>
                    </div>
                  }
                  <div class="billing__pix-copy">
                    <label>{{ 'BILLING.PIX_COPY_PASTE' | translate }}</label>
                    <div class="billing__pix-copy-field">
                      <code>{{ pixData()?.copyPaste || '---' }}</code>
                      <button mat-icon-button (click)="copyPixCode()">
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                  </div>
                  @if (pixData()?.expiresAt) {
                    <p class="billing__pix-expires">
                      {{ 'BILLING.EXPIRES_AT' | translate }}: {{ pixData()!.expiresAt | date:'short' }}
                    </p>
                  }
                  <p class="billing__pix-warning">
                    {{ 'BILLING.PIX_DUE_WARNING' | translate }}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Invoices -->
      <div class="billing__section">
        <h3 class="billing__section-title">
          <mat-icon>receipt_long</mat-icon>
          {{ 'BILLING.INVOICES' | translate }}
        </h3>
        <div class="card">
          @if (invoices().length === 0) {
            <p class="text-sm" style="color: var(--text-secondary); padding: 16px;">{{ 'BILLING.NO_INVOICES' | translate }}</p>
          } @else {
            <table mat-table [dataSource]="invoices()" class="billing__table">
              <ng-container matColumnDef="created_at">
                <th mat-header-cell *matHeaderCellDef>{{ 'IMPORT_STUDIO.DATE' | translate }}</th>
                <td mat-cell *matCellDef="let row">{{ row.created_at | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="invoice_type">
                <th mat-header-cell *matHeaderCellDef>{{ 'BILLING.TYPE' | translate }}</th>
                <td mat-cell *matCellDef="let row">
                  <span class="billing__event-chip">{{ row.invoice_type }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>{{ 'BILLING.AMOUNT' | translate }}</th>
                <td mat-cell *matCellDef="let row">{{ formatAmount(row.amount, row.currency) }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="billing__status-chip" [class]="'billing__status-chip--' + row.status?.toLowerCase()">
                    {{ row.status }}
                  </span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="invoiceColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: invoiceColumns;"></tr>
            </table>
          }
        </div>
      </div>

      <!-- Usage Trend Chart -->
      <div class="billing__section">
        <h3 class="billing__section-title">
          <mat-icon>trending_up</mat-icon>
          {{ 'BILLING.USAGE_TREND' | translate }}
        </h3>
        <div class="card">
          <div class="billing__chart">
            <canvas id="billingUsageTrendChart" width="700" height="250"></canvas>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .billing {
      max-width: 960px;

      &__current-plan { margin-bottom: 24px; }

      &__plan-gradient {
        padding: 32px; border-radius: 16px; color: #fff; position: relative; overflow: hidden;
        &--free { background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%); }
        &--starter { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
        &--growth { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); }
        &--enterprise { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); }
      }

      &__plan-badge {
        display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;
      }

      &__plan-title { font-size: 32px; font-weight: 800; margin: 0 0 4px 0; }
      &__plan-price { font-size: 18px; font-weight: 600; margin: 0 0 8px 0; opacity: 0.9; }
      &__plan-desc { font-size: 14px; margin: 0; opacity: 0.8; }
      &__plan-period { font-size: 13px; margin: 8px 0 0 0; opacity: 0.7; }

      &__plan-alert {
        display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px 16px;
        border-radius: 8px; font-size: 13px; font-weight: 600;
        &--error { background: rgba(239,68,68,0.3); }
        &--warning { background: rgba(245,158,11,0.3); }
        &--info { background: rgba(59,130,246,0.3); }
      }

      &__section { margin-bottom: 32px; }

      &__section-title {
        font-size: 18px; font-weight: 700; margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;
        color: var(--text-primary);
        mat-icon { color: var(--primary-color, #6366f1); }
      }

      &__toggles {
        display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
      }

      &__discount-badge {
        font-size: 10px; font-weight: 700; color: #22c55e; margin-left: 4px;
      }

      &__gauges-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;
      }

      &__gauge-card {
        display: flex; gap: 16px; padding: 20px; border-radius: 12px;
        border: 1px solid var(--border-color); background: var(--surface-color, #fff);
      }

      &__gauge-icon-wrap {
        width: 44px; height: 44px; border-radius: 12px; display: flex;
        align-items: center; justify-content: center; flex-shrink: 0;
      }

      &__gauge-content { flex: 1; min-width: 0; }
      &__gauge-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
      &__gauge-value { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
      &__gauge-limit { font-size: 14px; font-weight: 400; color: var(--text-secondary); }

      &__gauge-warning {
        display: flex; align-items: center; gap: 4px; font-size: 12px; margin-top: 6px;
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
        &--critical { color: var(--color-error, #ef4444); }
        &--warn { color: var(--color-warning, #f59e0b); }
      }

      &__plans-grid {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        @media (max-width: 960px) { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 600px) { grid-template-columns: 1fr; }
      }

      &__plan-card {
        border-radius: 16px; border: 1px solid var(--border-color);
        background: var(--surface-color, #fff); overflow: hidden; position: relative;
        transition: transform 0.2s, box-shadow 0.2s;
        &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        &--active { border-color: var(--primary-color, #6366f1); box-shadow: 0 0 0 2px var(--primary-color, #6366f1); }
        &--popular { border-color: var(--primary-color, #6366f1); }
      }

      &__plan-popular-badge {
        position: absolute; top: 12px; right: 12px; background: #fff; color: #6366f1;
        font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px;
        text-transform: uppercase; letter-spacing: 0.5px; z-index: 1;
      }

      &__plan-card-header {
        padding: 24px 20px; color: #fff;
        &--free { background: linear-gradient(135deg, #64748b, #94a3b8); }
        &--starter { background: linear-gradient(135deg, #6366f1, #818cf8); }
        &--growth { background: linear-gradient(135deg, #2563eb, #7c3aed); }
        &--enterprise { background: linear-gradient(135deg, #0f172a, #475569); }
      }

      &__plan-card-name { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
      &__plan-card-price { font-size: 22px; font-weight: 800; opacity: 0.95; }
      &__plan-card-body { padding: 20px; }

      &__plan-features {
        list-style: none; margin: 0 0 20px 0; padding: 0;
        li { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 13px; color: var(--text-primary); }
      }

      &__plan-check { font-size: 16px; width: 16px; height: 16px; color: #22c55e; }
      &__plan-btn { width: 100%; }
      &__plan-btn--enterprise { background: #0f172a !important; color: #fff !important; }
      &__payment-actions { display: flex; flex-direction: column; gap: 8px; }

      &__modal-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center; z-index: 1000;
      }

      &__modal {
        background: var(--surface-color, #fff); border-radius: 16px; width: 420px;
        max-width: 90vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      }

      &__modal-header {
        display: flex; align-items: center; justify-content: space-between; padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
        h3 { margin: 0; font-size: 18px; font-weight: 700; }
      }

      &__modal-body { padding: 24px; }
      &__pix-loading { text-align: center; padding: 32px 0; p { margin-top: 16px; color: var(--text-secondary); } }
      &__pix-content { display: flex; flex-direction: column; align-items: center; gap: 20px; }
      &__pix-qr { width: 220px; height: 220px; border-radius: 12px; border: 1px solid var(--border-color); }
      &__pix-qr-placeholder {
        width: 220px; height: 220px; border-radius: 12px; border: 2px dashed var(--border-color);
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
        color: var(--text-secondary);
        mat-icon { font-size: 64px; width: 64px; height: 64px; }
      }

      &__pix-copy {
        width: 100%;
        label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
      }

      &__pix-copy-field {
        display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px;
        border: 1px solid var(--border-color); background: var(--surface-hover, #f8f9fa);
        code { flex: 1; font-size: 12px; word-break: break-all; color: var(--text-primary); }
      }

      &__pix-expires { font-size: 13px; color: var(--text-secondary); margin: 0; }
      &__pix-warning { font-size: 12px; color: var(--color-warning, #f59e0b); margin: 0; text-align: center; }
      &__chart { width: 100%; overflow-x: auto; padding: 16px; }
      &__table { width: 100%; }

      &__event-chip {
        font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px;
        background: var(--surface-hover, #f1f5f9); color: var(--text-primary);
      }

      &__status-chip {
        font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;
        &--paid { background: rgba(34,197,94,0.1); color: #16a34a; }
        &--open { background: rgba(59,130,246,0.1); color: #2563eb; }
        &--draft { background: rgba(148,163,184,0.1); color: #64748b; }
        &--void { background: rgba(239,68,68,0.1); color: #ef4444; }
      }
    }
  `],
})
export class BillingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  plans = signal<Plan[]>([]);
  subscription = signal<SubscriptionInfo | null>(null);
  usageGauges = signal<UsageGauge[]>([]);
  invoices = signal<any[]>([]);
  invoiceColumns = ['created_at', 'invoice_type', 'amount', 'status'];

  selectedCycle = signal<'monthly' | 'annual'>('monthly');
  selectedCurrency = signal<'brl' | 'usd'>('brl');

  pixModalOpen = signal(false);
  pixLoading = signal(false);
  pixData = signal<{ qrCode: string | null; copyPaste: string; chargeId: string; expiresAt?: string } | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  getCurrentPriceDisplay(): string {
    const sub = this.subscription();
    if (!sub || sub.plan?.is_free) return this.translate.instant('BILLING.FREE_PRICE');

    const plan = this.plans().find(p => p.id === sub.plan_id);
    if (!plan) return '';

    const cycle = sub.billing_cycle || 'monthly';
    const currency = sub.currency || 'brl';
    const price = plan.prices.find(p => p.billing_cycle === cycle && p.currency === currency);
    if (!price) return '';

    return this.formatAmount(price.amount, currency) + (cycle === 'monthly' ? '/mês' : '/ano');
  }

  getPlanDescription(): string {
    const sub = this.subscription();
    return sub?.plan?.slug
      ? (this.plans().find(p => p.slug === sub.plan.slug)?.description || '')
      : this.translate.instant('BILLING.FREE_DESC');
  }

  getPlanPrice(plan: Plan): string {
    if (plan.is_free) return this.translate.instant('BILLING.FREE_PRICE');
    if (plan.slug === 'enterprise') return this.translate.instant('BILLING.CUSTOM_PRICE');

    const price = plan.prices.find(
      p => p.billing_cycle === this.selectedCycle() && p.currency === this.selectedCurrency()
    );
    if (!price) return '—';

    const suffix = this.selectedCycle() === 'monthly' ? '/mês' : '/ano';
    return this.formatAmount(price.amount, this.selectedCurrency()) + suffix;
  }

  getPlanFeatureList(plan: Plan): string[] {
    const features: string[] = [];
    for (const ent of plan.entitlements) {
      const label = this.getFeatureLabel(ent);
      if (label) features.push(label);
    }
    return features;
  }

  isUpgrade(plan: Plan): boolean {
    const currentOrder = this.plans().find(p => p.id === this.subscription()?.plan_id)?.display_order ?? 0;
    return plan.display_order > currentOrder;
  }

  isDowngrade(plan: Plan): boolean {
    const currentOrder = this.plans().find(p => p.id === this.subscription()?.plan_id)?.display_order ?? 0;
    return plan.display_order < currentOrder;
  }

  onSubscribe(plan: Plan, method: 'card' | 'pix'): void {
    if (method === 'pix') {
      this.pixModalOpen.set(true);
      this.pixLoading.set(true);
      this.pixData.set(null);
    }

    this.api.post<{ success: boolean; data: any }>('/billing/subscription/subscribe', {
      planSlug: plan.slug,
      billingCycle: this.selectedCycle(),
      currency: this.selectedCurrency(),
      paymentMethodType: method,
      successUrl: `${window.location.origin}/app/settings?payment=success`,
      cancelUrl: `${window.location.origin}/app/settings?payment=cancelled`,
    }).subscribe({
      next: (res) => {
        if (res.data.type === 'stripe_checkout') {
          if (res.data.mock) {
            this.snackBar.open(this.translate.instant('BILLING.STRIPE_NOT_CONFIGURED'), 'OK', { duration: 5000 });
          } else if (res.data.sessionUrl) {
            window.location.href = res.data.sessionUrl;
          }
        } else if (res.data.type === 'pix_checkout') {
          this.pixData.set(res.data);
          this.pixLoading.set(false);
        }
      },
      error: (err) => {
        const msg = err?.error?.error?.message || this.translate.instant('BILLING.SUBSCRIBE_ERROR');
        this.snackBar.open(msg, 'OK', { duration: 4000 });
        this.pixLoading.set(false);
        this.pixModalOpen.set(false);
      },
    });
  }

  onDowngrade(plan: Plan): void {
    this.api.post<{ success: boolean; data: any }>('/billing/subscription/downgrade', {
      planSlug: plan.slug,
    }).subscribe({
      next: (res) => {
        const msg = res.data.scheduled
          ? this.translate.instant('BILLING.DOWNGRADE_SCHEDULED')
          : this.translate.instant('BILLING.DOWNGRADE_APPLIED');
        this.snackBar.open(msg, 'OK', { duration: 5000 });
        this.loadData();
      },
      error: (err) => {
        const msg = err?.error?.error?.message || this.translate.instant('BILLING.DOWNGRADE_ERROR');
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  onContactSales(): void {
    const phone = '54999393434';
    const message = this.translate.instant('BILLING.WHATSAPP_MESSAGE');
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  closePixModal(): void {
    this.pixModalOpen.set(false);
    this.pixData.set(null);
  }

  copyPixCode(): void {
    const code = this.pixData()?.copyPaste;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.snackBar.open(this.translate.instant('BILLING.PIX_COPIED'), 'OK', { duration: 2000 });
      });
    }
  }

  formatAmount(amount: number, currency: string): string {
    const value = amount / 100;
    if (currency === 'brl') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  getGaugeIconBg(gauge: UsageGauge): string {
    const colors: Record<string, string> = { green: 'rgba(34,197,94,0.1)', amber: 'rgba(245,158,11,0.1)', red: 'rgba(239,68,68,0.1)' };
    return colors[gauge.color] || colors['green'];
  }

  getGaugeIconColor(gauge: UsageGauge): string {
    const colors: Record<string, string> = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };
    return colors[gauge.color] || colors['green'];
  }

  // ─── Private ──────────────────────────────────────────────

  private loadData(): void {
    // Load plans from new API
    this.api.get<{ success: boolean; data: Plan[] }>('/billing/plans').subscribe({
      next: (res) => this.plans.set(res.data || []),
    });

    // Load subscription info with usage
    this.api.get<{ success: boolean; data: SubscriptionInfo }>('/billing/subscription').subscribe({
      next: (res) => {
        this.subscription.set(res.data);
        this.buildGauges(res.data);
      },
    });

    // Load invoices
    this.api.get<{ success: boolean; data: any[] }>('/billing/invoices').subscribe({
      next: (res) => this.invoices.set(res.data || []),
    });

    // Load chart
    this.api.get<{ success: boolean; data: any[] }>('/billing/usage/daily-trend', { days: 30 }).subscribe({
      next: (res) => this.renderChart(res.data),
      error: () => this.renderChartWithDemoData(),
    });
  }

  private buildGauges(sub: SubscriptionInfo): void {
    if (!sub?.usage) return;

    const gaugeConfig: Array<{ key: string; labelKey: string; icon: string }> = [
      { key: 'max_customers', labelKey: 'BILLING.ACTIVE_CUSTOMERS', icon: 'people' },
      { key: 'max_scenarios', labelKey: 'BILLING.ACTIVE_SCENARIOS', icon: 'route' },
      { key: 'max_users', labelKey: 'BILLING.AGENT_SEATS', icon: 'support_agent' },
      { key: 'max_actions', labelKey: 'BILLING.ACTIVE_ACTIONS', icon: 'bolt' },
      { key: 'max_tasks_per_month', labelKey: 'BILLING.TASKS_THIS_MONTH', icon: 'task_alt' },
      { key: 'ai_queries_per_month', labelKey: 'BILLING.AI_QUERIES', icon: 'auto_awesome' },
    ];

    const gauges: UsageGauge[] = [];
    for (const cfg of gaugeConfig) {
      const usage = sub.usage[cfg.key];
      if (!usage) continue;

      const percentage = usage.percentage ?? 0;
      let color = 'green';
      if (percentage >= 95) color = 'red';
      else if (percentage >= 80) color = 'amber';

      gauges.push({
        labelKey: cfg.labelKey,
        icon: cfg.icon,
        current: usage.current,
        limit: usage.limit,
        percentage,
        color,
      });
    }

    this.usageGauges.set(gauges);
  }

  private getFeatureLabel(ent: PlanEntitlement): string | null {
    const labels: Record<string, (e: PlanEntitlement) => string | null> = {
      max_customers: (e) => e.value_limit === null ? 'Customers ilimitados' : `${e.value_limit?.toLocaleString()} customers`,
      max_scenarios: (e) => e.value_limit === null ? 'Cenários ilimitados' : `${e.value_limit} cenários`,
      max_actions: (e) => e.value_limit === null ? 'Ações ilimitadas' : `${e.value_limit} ações`,
      max_users: (e) => e.value_limit === null ? 'Usuários ilimitados' : `${e.value_limit} usuários`,
      max_tasks_per_month: (e) => e.value_limit === null ? 'Tarefas ilimitadas' : `${e.value_limit?.toLocaleString()} tarefas/mês`,
      ai_copilot: (e) => e.value_boolean ? 'IA Copilot' : null,
      ai_queries_per_month: (e) => e.value_limit ? `${e.value_limit} queries IA/mês` : e.value_limit === null ? 'IA ilimitada' : null,
      integrations: (e) => e.value_tier && e.value_tier !== 'none' ? `Integrações: ${e.value_tier}` : null,
      reports: (e) => e.value_tier ? `Relatórios: ${e.value_tier}` : null,
      promise_to_pay: (e) => e.value_tier && e.value_tier !== 'none' ? 'Promessa de pagamento' : null,
      payment_plans: (e) => e.value_boolean ? 'Planos de pagamento' : null,
      api_access: (e) => e.value_tier && e.value_tier !== 'none' ? `API: ${e.value_tier}` : null,
      sso_saml: (e) => e.value_boolean ? 'SSO / SAML' : null,
      max_collection_agencies: (e) => e.value_limit ? `${e.value_limit} agências de cobrança` : e.value_limit === null ? 'Agências ilimitadas' : null,
    };

    const fn = labels[ent.feature_key];
    return fn ? fn(ent) : null;
  }

  private renderChart(data: any[]): void {
    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;
      const canvas = document.getElementById('billingUsageTrendChart') as HTMLCanvasElement;
      if (!canvas) return;

      const dateMap: Record<string, number> = {};
      for (const row of data) {
        const dateStr = typeof row.date === 'string' ? row.date.substring(0, 10) : row.date;
        dateMap[dateStr] = (dateMap[dateStr] || 0) + parseInt(row.count || '0');
      }

      const labels = Object.keys(dateMap).sort();
      const values = labels.map(d => dateMap[d]);

      new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Daily Actions',
            data: values,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
        },
      });
    }).catch(() => {});
  }

  private renderChartWithDemoData(): void {
    const data: any[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      data.push({ date: d.toISOString().substring(0, 10), count: String(Math.floor(Math.random() * 300 + 100)) });
    }
    this.renderChart(data);
  }
}
