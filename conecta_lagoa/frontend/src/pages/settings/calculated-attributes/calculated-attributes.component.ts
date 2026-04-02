import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';

interface CalculatedAttribute {
  id: string;
  name: string;
  description: string;
  output_type: string;
  calculation_type: string;
  formula: any;
  schedule: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Factor {
  field: string;
  weight: number;
  normalize?: { min: number; max: number };
}

interface Rule {
  conditions: { field: string; operator: string; value: string }[];
  output: string;
}

const AVAILABLE_FIELDS = [
  'total_overdue', 'days_in_dunning', 'invoice_count',
  'payment_score', 'segment', 'days_overdue', 'total_amount',
  'paid_amount', 'risk_score',
];

const FORMULA_EXAMPLES = [
  { name: 'Score de Risco', expression: '(0.25 * min(days_overdue / 180, 1) + 0.15 * min(days_in_dunning / 120, 1) + 0.10 * min(invoice_count / 20, 1) + 0.20 * min(total_overdue / max(total_amount, 1), 1) + 0.15 * (1 - payment_score) + 0.10 * (1 - min(paid_amount / max(total_amount, 1), 1)) + 0.05 * segment) * 100' },
  { name: 'Taxa de Pagamento', expression: 'paid_amount / (total_amount + 0.01) * 100' },
  { name: 'Prioridade', expression: 'days_overdue * 2 + total_overdue / 1000' },
  { name: 'Índice de Gravidade', expression: '(days_in_dunning * total_overdue) / (invoice_count + 1)' },
];

const OPERATORS = ['==', '!=', '>', '<', '>=', '<=', 'IN'];

@Component({
  selector: 'app-calculated-attributes',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="calc-attrs">
      <div class="config-section__header">
        <div>
          <h3 class="config-section__title">{{ 'CALCULATED_ATTRS.TITLE' | translate }}</h3>
          <p class="config-section__desc">{{ 'CALCULATED_ATTRS.DESC' | translate }}</p>
        </div>
        <button class="btn-primary" (click)="openForm()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
          {{ 'CALCULATED_ATTRS.NEW' | translate }}
        </button>
      </div>

      <!-- Form -->
      <div class="attr-form" *ngIf="showForm">
        <h4>{{ editing ? ('CALCULATED_ATTRS.EDIT' | translate) : ('CALCULATED_ATTRS.NEW' | translate) }}</h4>
        <div class="form-grid">
          <div class="form-field">
            <label>{{ 'CALCULATED_ATTRS.NAME' | translate }}</label>
            <input type="text" [(ngModel)]="form.name" placeholder="e.g. Risk Score" />
          </div>
          <div class="form-field">
            <label>{{ 'CALCULATED_ATTRS.OUTPUT_TYPE' | translate }}</label>
            <select [(ngModel)]="form.outputType">
              <option value="number">Number</option>
              <option value="category">Category</option>
              <option value="boolean">Boolean</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ 'CALCULATED_ATTRS.CALC_TYPE' | translate }}</label>
            <select [(ngModel)]="form.calculationType" (ngModelChange)="onCalcTypeChange()">
              <option value="weighted_sum">{{ 'CALCULATED_ATTRS.WEIGHTED_SUM' | translate }}</option>
              <option value="decision_table">{{ 'CALCULATED_ATTRS.DECISION_TABLE' | translate }}</option>
              <option value="formula">{{ 'CALCULATED_ATTRS.FORMULA' | translate }}</option>
              <option value="ai" disabled>{{ 'CALCULATED_ATTRS.AI' | translate }}</option>
            </select>
          </div>
          <div class="form-field">
            <label>{{ 'CALCULATED_ATTRS.SCHEDULE' | translate }}</label>
            <select [(ngModel)]="form.schedule">
              <option value="">Manual</option>
              <option value="daily">Daily</option>
              <option value="hourly">Hourly</option>
              <option value="on_event">On Event</option>
            </select>
          </div>
        </div>

        <div class="form-field" style="margin-top: 12px;">
          <label>{{ 'COMMON.DESCRIPTION' | translate }}</label>
          <textarea [(ngModel)]="form.description" rows="2" placeholder="Describe what this attribute calculates..."></textarea>
        </div>

        <!-- Weighted Sum Config -->
        <div class="formula-section" *ngIf="form.calculationType === 'weighted_sum'">
          <h5>{{ 'CALCULATED_ATTRS.WEIGHTED_SUM' | translate }}</h5>
          <div class="factor-list">
            <div class="factor-row" *ngFor="let factor of factors; let i = index">
              <select [(ngModel)]="factor.field">
                <option value="" disabled>{{ 'CALCULATED_ATTRS.FIELD' | translate }}...</option>
                <option *ngFor="let f of availableFields" [value]="f">{{ f }}</option>
              </select>
              <div class="weight-control">
                <label>{{ 'CALCULATED_ATTRS.WEIGHT' | translate }}: {{ factor.weight }}</label>
                <input type="range" min="0" max="1" step="0.05" [(ngModel)]="factor.weight" />
              </div>
              <button class="btn-icon btn-icon--danger" (click)="removeFactor(i)" title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <button class="btn-secondary btn-sm" (click)="addFactor()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {{ 'CALCULATED_ATTRS.ADD_FACTOR' | translate }}
          </button>
        </div>

        <!-- Decision Table Config -->
        <div class="formula-section" *ngIf="form.calculationType === 'decision_table'">
          <h5>{{ 'CALCULATED_ATTRS.DECISION_TABLE' | translate }}</h5>
          <div class="rule-list">
            <div class="rule-row" *ngFor="let rule of rules; let ri = index">
              <div class="rule-conditions">
                <div class="condition-row" *ngFor="let cond of rule.conditions; let ci = index">
                  <select [(ngModel)]="cond.field">
                    <option value="" disabled>{{ 'CALCULATED_ATTRS.FIELD' | translate }}</option>
                    <option *ngFor="let f of availableFields" [value]="f">{{ f }}</option>
                  </select>
                  <select [(ngModel)]="cond.operator" class="op-select">
                    <option *ngFor="let op of operators" [value]="op">{{ op }}</option>
                  </select>
                  <input type="text" [(ngModel)]="cond.value" [placeholder]="'CALCULATED_ATTRS.VALUE' | translate" class="value-input" />
                  <button class="btn-icon btn-icon--danger" *ngIf="rule.conditions.length > 1" (click)="removeCondition(ri, ci)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <button class="btn-link btn-xs" (click)="addCondition(ri)">+ Condition</button>
              </div>
              <div class="rule-output">
                <input type="text" [(ngModel)]="rule.output" [placeholder]="'CALCULATED_ATTRS.OUTPUT' | translate" />
              </div>
              <button class="btn-icon btn-icon--danger" (click)="removeRule(ri)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <button class="btn-secondary btn-sm" (click)="addRule()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {{ 'CALCULATED_ATTRS.ADD_RULE' | translate }}
          </button>
          <div class="form-field" style="margin-top: 12px;">
            <label>Default {{ 'CALCULATED_ATTRS.OUTPUT' | translate }}</label>
            <input type="text" [(ngModel)]="defaultOutput" />
          </div>
        </div>

        <!-- Formula Config -->
        <div class="formula-section" *ngIf="form.calculationType === 'formula'">
          <h5>{{ 'CALCULATED_ATTRS.FORMULA' | translate }}</h5>
          <div class="form-field">
            <label>{{ 'CALCULATED_ATTRS.EXPRESSION' | translate }}</label>
            <textarea [(ngModel)]="expression" rows="3" placeholder="e.g. total_overdue / (days_in_dunning + 1) + invoice_count" class="code-textarea"></textarea>
          </div>
          <div class="formula-help">
            <div class="formula-help__fields">
              <span class="formula-help__title">{{ 'CALCULATED_ATTRS.AVAILABLE_FIELDS' | translate }}:</span>
              <div class="formula-help__chips">
                <code class="formula-help__chip" *ngFor="let f of availableFields" (click)="insertField(f)">{{ f }}</code>
              </div>
            </div>
            <div class="formula-help__examples">
              <span class="formula-help__title">{{ 'CALCULATED_ATTRS.EXAMPLES' | translate }}:</span>
              <div class="formula-help__example-list">
                <button class="formula-help__example" *ngFor="let ex of formulaExamples" (click)="expression = ex.expression">
                  <strong>{{ ex.name }}:</strong> <code>{{ ex.expression }}</code>
                </button>
              </div>
            </div>
            <p class="hint">{{ 'CALCULATED_ATTRS.FORMULA_TIP' | translate }}</p>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" (click)="save()">{{ 'COMMON.SAVE' | translate }}</button>
          <button class="btn-secondary" (click)="closeForm()">{{ 'COMMON.CANCEL' | translate }}</button>
        </div>
      </div>

      <!-- List -->
      <div class="attr-list" *ngIf="!showForm">
        <div class="attr-card" *ngFor="let attr of attributes()">
          <div class="attr-card__header">
            <div class="attr-card__info">
              <span class="attr-card__name">{{ attr.name }}</span>
              <span class="attr-card__badges">
                <span class="badge badge--outline">{{ attr.output_type }}</span>
                <span class="badge badge--primary">{{ getCalcTypeLabel(attr.calculation_type) }}</span>
              </span>
            </div>
            <div class="attr-card__actions">
              <button class="btn-secondary btn-sm" (click)="recalculate(attr)" [disabled]="recalculating() === attr.id">
                {{ recalculating() === attr.id ? ('CALCULATED_ATTRS.RECALCULATING' | translate) : ('CALCULATED_ATTRS.RECALCULATE' | translate) }}
              </button>
              <button class="btn-icon" (click)="editAttr(attr)" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button class="btn-icon btn-icon--danger" (click)="deleteAttr(attr)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
          <p class="attr-card__desc" *ngIf="attr.description">{{ attr.description }}</p>
          <div class="attr-card__meta">
            <span *ngIf="attr.schedule">{{ 'CALCULATED_ATTRS.SCHEDULE' | translate }}: {{ attr.schedule }}</span>
            <span>Updated: {{ attr.updated_at | date:'short' }}</span>
          </div>
        </div>

        <div class="empty-state" *ngIf="attributes().length === 0">
          <p>{{ 'CALCULATED_ATTRS.EMPTY' | translate }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calc-attrs {
      max-width: 900px;
    }

    .config-section__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .config-section__title {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px;
    }

    .config-section__desc {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }

    .attr-form {
      background: var(--surface-color, #fff);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .attr-form h4 {
      margin: 0 0 20px;
      font-size: 16px;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-field label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .form-field input,
    .form-field select,
    .form-field textarea {
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      background: var(--surface-color, #fff);
      color: var(--text-primary);
      transition: border-color 0.15s;
    }

    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: var(--color-primary, #6366f1);
    }

    .code-textarea {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 13px !important;
    }

    .formula-section {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--surface-hover, #f8f9fa);
    }

    .formula-section h5 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
    }

    .formula-help {
      margin-top: 12px;

      &__title {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        display: block;
        margin-bottom: 6px;
      }

      &__fields { margin-bottom: 12px; }
      &__chips { display: flex; flex-wrap: wrap; gap: 6px; }
      &__chip {
        padding: 3px 10px;
        background: var(--surface-card);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s;
        &:hover { border-color: var(--primary); color: var(--primary); }
      }

      &__examples { margin-bottom: 12px; }
      &__example-list { display: flex; flex-direction: column; gap: 6px; }
      &__example {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--surface-card);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;

        strong { color: var(--text-primary); white-space: nowrap; }
        code { color: var(--primary); font-size: 11px; }

        &:hover { border-color: var(--primary); background: var(--primary-subtle, rgba(0,138,252,0.04)); }
      }
    }

    .factor-list, .rule-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 12px;
    }

    .factor-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .factor-row select {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 13px;
      background: var(--surface-color, #fff);
      color: var(--text-primary);
    }

    .weight-control {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .weight-control label {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .weight-control input[type="range"] {
      width: 100%;
    }

    .rule-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--surface-color, #fff);
    }

    .rule-conditions {
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .condition-row {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .condition-row select,
    .condition-row input {
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 13px;
      background: var(--surface-color, #fff);
      color: var(--text-primary);
    }

    .condition-row select {
      flex: 1;
    }

    .op-select {
      width: 70px !important;
      flex: none !important;
    }

    .value-input {
      flex: 1 !important;
    }

    .rule-output {
      flex: 1;
    }

    .rule-output input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 13px;
      background: var(--surface-color, #fff);
      color: var(--text-primary);
    }

    .hint {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 8px 0 0;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }

    .attr-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .attr-card {
      padding: 16px 20px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--surface-color, #fff);
      transition: border-color 0.15s;
    }

    .attr-card:hover {
      border-color: var(--color-primary, #6366f1);
    }

    .attr-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .attr-card__info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .attr-card__name {
      font-weight: 600;
      font-size: 15px;
    }

    .attr-card__badges {
      display: flex;
      gap: 6px;
    }

    .attr-card__actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .attr-card__desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 8px 0 0;
    }

    .attr-card__meta {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .badge--outline {
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .badge--primary {
      background: var(--color-primary, #6366f1);
      color: #fff;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
      border: 1px dashed var(--border-color);
      border-radius: 12px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: var(--color-primary, #6366f1);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .btn-primary:hover { opacity: 0.9; }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-secondary:hover { background: var(--surface-hover, #f5f5f5); }
    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-xs { padding: 2px 6px; font-size: 11px; }

    .btn-link {
      background: none;
      border: none;
      color: var(--color-primary, #6366f1);
      font-size: 12px;
      cursor: pointer;
      padding: 2px 4px;
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-icon:hover { background: var(--surface-hover, #f5f5f5); }

    .btn-icon--danger:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
  `],
})
export class CalculatedAttributesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  attributes = signal<CalculatedAttribute[]>([]);
  recalculating = signal<string | null>(null);
  showForm = false;
  editing = false;
  editId = '';

  availableFields = AVAILABLE_FIELDS;
  formulaExamples = FORMULA_EXAMPLES;

  insertField(field: string): void {
    this.expression = this.expression ? this.expression + ' ' + field : field;
  }
  operators = OPERATORS;

  form = { name: '', description: '', outputType: 'number', calculationType: 'weighted_sum', schedule: '' };
  factors: Factor[] = [{ field: 'total_overdue', weight: 0.5 }];
  rules: Rule[] = [{ conditions: [{ field: '', operator: '>', value: '' }], output: '' }];
  defaultOutput = '';
  expression = '';

  ngOnInit(): void {
    this.loadAttributes();
  }

  private loadAttributes(): void {
    this.api.get<{ success: boolean; data: CalculatedAttribute[] }>('/data/attributes').subscribe({
      next: (res) => this.attributes.set(res.data || []),
      error: () => this.attributes.set([]),
    });
  }

  getCalcTypeLabel(type: string): string {
    const map: Record<string, string> = {
      weighted_sum: 'Weighted Sum',
      decision_table: 'Decision Table',
      formula: 'Formula',
      ai: 'AI',
    };
    return map[type] || type;
  }

  openForm(): void {
    this.showForm = true;
    this.editing = false;
    this.editId = '';
    this.form = { name: '', description: '', outputType: 'number', calculationType: 'weighted_sum', schedule: '' };
    this.factors = [{ field: 'total_overdue', weight: 0.5 }];
    this.rules = [{ conditions: [{ field: '', operator: '>', value: '' }], output: '' }];
    this.defaultOutput = '';
    this.expression = '';
  }

  closeForm(): void {
    this.showForm = false;
  }

  onCalcTypeChange(): void {
    // Reset formula-specific state when type changes
  }

  editAttr(attr: CalculatedAttribute): void {
    this.showForm = true;
    this.editing = true;
    this.editId = attr.id;
    this.form = {
      name: attr.name,
      description: attr.description || '',
      outputType: attr.output_type,
      calculationType: attr.calculation_type,
      schedule: attr.schedule || '',
    };

    const formula = attr.formula as any;
    if (attr.calculation_type === 'weighted_sum') {
      this.factors = formula?.factors || [{ field: '', weight: 0.5 }];
    } else if (attr.calculation_type === 'decision_table') {
      this.rules = formula?.rules || [{ conditions: [{ field: '', operator: '>', value: '' }], output: '' }];
      this.defaultOutput = formula?.defaultOutput || '';
    } else if (attr.calculation_type === 'formula') {
      this.expression = formula?.expression || '';
    }
  }

  addFactor(): void {
    this.factors.push({ field: '', weight: 0.5 });
  }

  removeFactor(i: number): void {
    this.factors.splice(i, 1);
  }

  addRule(): void {
    this.rules.push({ conditions: [{ field: '', operator: '>', value: '' }], output: '' });
  }

  removeRule(i: number): void {
    this.rules.splice(i, 1);
  }

  addCondition(ri: number): void {
    this.rules[ri].conditions.push({ field: '', operator: '==', value: '' });
  }

  removeCondition(ri: number, ci: number): void {
    this.rules[ri].conditions.splice(ci, 1);
  }

  save(): void {
    let formula: any;
    if (this.form.calculationType === 'weighted_sum') {
      formula = { type: 'weighted_sum', factors: this.factors };
    } else if (this.form.calculationType === 'decision_table') {
      formula = { type: 'decision_table', rules: this.rules, defaultOutput: this.defaultOutput };
    } else if (this.form.calculationType === 'formula') {
      formula = { type: 'formula', expression: this.expression };
    }

    const body = {
      name: this.form.name,
      description: this.form.description,
      outputType: this.form.outputType,
      calculationType: this.form.calculationType,
      formula,
      schedule: this.form.schedule || null,
    };

    const request = this.editing
      ? this.api.patch<{ success: boolean; data: CalculatedAttribute }>(`/data/attributes/${this.editId}`, body)
      : this.api.post<{ success: boolean; data: CalculatedAttribute }>('/data/attributes', body);

    request.subscribe({
      next: () => {
        this.toast.success(this.editing ? 'Attribute updated' : 'Attribute created');
        this.closeForm();
        this.loadAttributes();
      },
      error: () => this.toast.error('Failed to save attribute'),
    });
  }

  deleteAttr(attr: CalculatedAttribute): void {
    this.toast.confirmDelete(attr.name).subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete<{ success: boolean }>(`/data/attributes/${attr.id}`).subscribe({
        next: () => {
          this.toast.success('Attribute deleted');
          this.loadAttributes();
        },
        error: () => this.toast.error('Failed to delete attribute'),
      });
    });
  }

  recalculate(attr: CalculatedAttribute): void {
    this.recalculating.set(attr.id);
    this.api.post<{ success: boolean; data: { processed: number; errors: number } }>(`/data/attributes/${attr.id}/recalculate`, {}).subscribe({
      next: (res) => {
        const d = res.data;
        this.toast.info(`Recalculated: ${d.processed} processed, ${d.errors} errors`);
        this.recalculating.set(null);
      },
      error: () => {
        this.toast.error('Recalculation failed');
        this.recalculating.set(null);
      },
    });
  }
}
