import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/services/toast.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Workgroup {
  id: string;
  name: string;
  description: string;
  manager_id: string | null;
  member_ids: string[];
  is_active: boolean;
}

interface WorkQueue {
  id: string;
  name: string;
  description: string;
  workgroup_id: string;
  priority: number;
  auto_assign: boolean;
  max_capacity: number | null;
  is_active: boolean;
}

@Component({
  selector: 'app-workspace-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="workspace-config">
      <!-- Workgroups Section -->
      <div class="config-section">
        <div class="config-section__header">
          <div>
            <h3 class="config-section__title">{{ 'WORKSPACE_CONFIG.WORKGROUPS' | translate }}</h3>
            <p class="config-section__desc">{{ 'WORKSPACE_CONFIG.WORKGROUPS_DESC' | translate }}</p>
          </div>
          <button class="btn-primary" (click)="showWorkgroupForm = true; editingWorkgroup = null; resetWorkgroupForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {{ 'WORKSPACE_CONFIG.NEW_WORKGROUP' | translate }}
          </button>
        </div>

        <!-- Workgroup Form -->
        <div class="config-form" *ngIf="showWorkgroupForm">
          <h4>{{ editingWorkgroup ? ('WORKSPACE_CONFIG.EDIT_WORKGROUP' | translate) : ('WORKSPACE_CONFIG.NEW_WORKGROUP' | translate) }}</h4>
          <div class="config-form__row">
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.NAME' | translate }}</label>
              <input type="text" [(ngModel)]="wgForm.name" placeholder="e.g. Collections Team A" />
            </div>
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.DESCRIPTION' | translate }}</label>
              <input type="text" [(ngModel)]="wgForm.description" placeholder="Team description..." />
            </div>
          </div>

          <!-- Manager -->
          <div class="config-form__row">
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.MANAGER' | translate }}</label>
              <select [(ngModel)]="wgForm.managerId">
                <option value="">{{ 'WORKSPACE_CONFIG.NO_MANAGER' | translate }}</option>
                <option *ngFor="let u of activeUsers()" [value]="u.id">{{ u.name }} ({{ u.email }})</option>
              </select>
            </div>
          </div>

          <!-- Members -->
          <div class="config-form__members">
            <label>{{ 'WORKSPACE_CONFIG.MEMBERS_LABEL' | translate }}</label>
            <div class="members-search">
              <input type="text" [(ngModel)]="memberSearch" [placeholder]="'WORKSPACE_CONFIG.SEARCH_USERS' | translate" />
            </div>
            <div class="members-list">
              <label class="member-item" *ngFor="let u of filteredUsers()">
                <input type="checkbox" [checked]="wgForm.memberIds.includes(u.id)" (change)="toggleMember(u.id)" />
                <div class="member-item__info">
                  <span class="member-item__name">{{ u.name }}</span>
                  <span class="member-item__email">{{ u.email }}</span>
                </div>
                <span class="member-item__role">{{ u.role }}</span>
              </label>
              <div class="members-empty" *ngIf="filteredUsers().length === 0">
                {{ 'WORKSPACE_CONFIG.NO_USERS_FOUND' | translate }}
              </div>
            </div>
            <div class="members-count" *ngIf="wgForm.memberIds.length > 0">
              {{ wgForm.memberIds.length }} {{ 'WORKSPACE_CONFIG.MEMBERS_SELECTED' | translate }}
            </div>
          </div>

          <div class="config-form__actions">
            <button class="btn-secondary" (click)="showWorkgroupForm = false">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="btn-primary" (click)="saveWorkgroup()" [disabled]="!wgForm.name">{{ 'COMMON.SAVE' | translate }}</button>
          </div>
        </div>

        <!-- Workgroup Cards -->
        <div class="config-cards">
          <div class="config-card" *ngFor="let wg of workgroups()">
            <div class="config-card__info">
              <div class="config-card__name">{{ wg.name }}</div>
              <div class="config-card__meta">{{ wg.description || '—' }}</div>
              <div class="config-card__badges">
                <span class="config-card__badge">{{ (wg.member_ids?.length || 0) }} {{ 'WORKSPACE_CONFIG.MEMBERS' | translate }}</span>
                <span class="config-card__badge" *ngIf="getManagerName(wg.manager_id)">{{ 'WORKSPACE_CONFIG.MANAGER' | translate }}: {{ getManagerName(wg.manager_id) }}</span>
              </div>
              <div class="config-card__members" *ngIf="wg.member_ids && wg.member_ids.length > 0">
                <span class="config-card__member-chip" *ngFor="let uid of wg.member_ids.slice(0, 5)">{{ getUserName(uid) }}</span>
                <span class="config-card__member-more" *ngIf="wg.member_ids.length > 5">+{{ wg.member_ids.length - 5 }}</span>
              </div>
            </div>
            <div class="config-card__actions">
              <button class="btn-icon" (click)="editWorkgroup(wg)" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"/></svg>
              </button>
              <button class="btn-icon btn-icon--danger" (click)="deleteWorkgroup(wg)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
              </button>
            </div>
          </div>
          <div class="config-empty" *ngIf="workgroups().length === 0">
            {{ 'WORKSPACE_CONFIG.NO_WORKGROUPS' | translate }}
          </div>
        </div>
      </div>

      <!-- Work Queues Section -->
      <div class="config-section">
        <div class="config-section__header">
          <div>
            <h3 class="config-section__title">{{ 'WORKSPACE_CONFIG.WORK_QUEUES' | translate }}</h3>
            <p class="config-section__desc">{{ 'WORKSPACE_CONFIG.WORK_QUEUES_DESC' | translate }}</p>
          </div>
          <button class="btn-primary" (click)="showQueueForm = true; editingQueue = null; resetQueueForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            {{ 'WORKSPACE_CONFIG.NEW_QUEUE' | translate }}
          </button>
        </div>

        <!-- Queue Form -->
        <div class="config-form" *ngIf="showQueueForm">
          <h4>{{ editingQueue ? ('WORKSPACE_CONFIG.EDIT_QUEUE' | translate) : ('WORKSPACE_CONFIG.NEW_QUEUE' | translate) }}</h4>
          <div class="config-form__row">
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.NAME' | translate }}</label>
              <input type="text" [(ngModel)]="queueForm.name" placeholder="e.g. High Priority Calls" />
            </div>
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.WORKGROUP' | translate }}</label>
              <select [(ngModel)]="queueForm.workgroupId">
                <option value="">{{ 'WORKSPACE_CONFIG.SELECT_WORKGROUP' | translate }}</option>
                <option *ngFor="let wg of workgroups()" [value]="wg.id">{{ wg.name }}</option>
              </select>
            </div>
          </div>
          <div class="config-form__row">
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.DESCRIPTION' | translate }}</label>
              <input type="text" [(ngModel)]="queueForm.description" placeholder="Queue description..." />
            </div>
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.PRIORITY' | translate }}</label>
              <input type="number" [(ngModel)]="queueForm.priority" min="0" max="100" />
            </div>
          </div>
          <div class="config-form__row">
            <div class="config-form__field config-form__field--checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="queueForm.autoAssign" />
                {{ 'WORKSPACE_CONFIG.AUTO_ASSIGN' | translate }}
              </label>
            </div>
            <div class="config-form__field">
              <label>{{ 'WORKSPACE_CONFIG.MAX_CAPACITY' | translate }}</label>
              <input type="number" [(ngModel)]="queueForm.maxCapacity" min="1" placeholder="Unlimited" />
            </div>
          </div>
          <div class="config-form__actions">
            <button class="btn-secondary" (click)="showQueueForm = false">{{ 'COMMON.CANCEL' | translate }}</button>
            <button class="btn-primary" (click)="saveQueue()" [disabled]="!queueForm.name || !queueForm.workgroupId">{{ 'COMMON.SAVE' | translate }}</button>
          </div>
        </div>

        <!-- Queue Cards -->
        <div class="config-cards">
          <div class="config-card" *ngFor="let q of workQueues()">
            <div class="config-card__info">
              <div class="config-card__name">{{ q.name }}</div>
              <div class="config-card__meta">{{ q.description || '—' }}</div>
              <div class="config-card__badges">
                <span class="config-card__badge">{{ getWorkgroupName(q.workgroup_id) }}</span>
                <span class="config-card__badge" *ngIf="q.auto_assign">Auto-assign</span>
                <span class="config-card__badge">Priority: {{ q.priority }}</span>
              </div>
            </div>
            <div class="config-card__actions">
              <button class="btn-icon" (click)="editQueue(q)" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931z"/></svg>
              </button>
              <button class="btn-icon btn-icon--danger" (click)="deleteQueue(q)" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
              </button>
            </div>
          </div>
          <div class="config-empty" *ngIf="workQueues().length === 0">
            {{ 'WORKSPACE_CONFIG.NO_QUEUES' | translate }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-config { display: flex; flex-direction: column; gap: 32px; }

    .config-section { }
    .config-section__header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px;
    }
    .config-section__title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
    .config-section__desc { font-size: 14px; color: var(--text-secondary); }

    .config-form {
      background: var(--surface-ground); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      padding: 24px; margin-bottom: 20px;
      h4 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--text-primary); }
    }
    .config-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .config-form__field {
      display: flex; flex-direction: column; gap: 6px;
      label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
      input, select {
        padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);
        font-size: 14px; font-family: inherit; background: var(--surface-card); color: var(--text-primary);
        outline: none; transition: border-color 0.2s;
        &:focus { border-color: var(--primary); }
      }
      &--checkbox label {
        display: flex; align-items: center; gap: 8px; cursor: pointer;
        input { width: auto; }
      }
    }
    .config-form__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

    .config-cards { display: flex; flex-direction: column; gap: 12px; }
    .config-card {
      display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
      background: var(--surface-card); border: 1px solid var(--border-color); border-radius: var(--radius-md);
      transition: box-shadow 0.2s;
      &:hover { box-shadow: var(--shadow-sm); }
    }
    .config-card__info { flex: 1; }
    .config-card__name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .config-card__meta { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
    .config-card__badges { display: flex; gap: 8px; margin-top: 8px; }
    .config-card__badge {
      font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 100px;
      background: var(--primary-subtle); color: var(--primary);
    }
    .config-card__actions { display: flex; gap: 4px; }
    .config-empty {
      text-align: center; padding: 40px; color: var(--text-tertiary); font-size: 14px;
      background: var(--surface-ground); border-radius: var(--radius-md); border: 1px dashed var(--border-color);
    }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--primary);
      color: white; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
      &:hover { background: var(--primary-hover); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-secondary {
      padding: 10px 20px; background: var(--surface-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; cursor: pointer;
      color: var(--text-primary); font-family: inherit;
      &:hover { background: var(--surface-hover); }
    }
    .btn-icon {
      padding: 8px; background: none; border: none; color: var(--text-secondary); cursor: pointer;
      border-radius: var(--radius-sm); display: flex; transition: all 0.2s;
      &:hover { background: var(--surface-hover); color: var(--text-primary); }
      &--danger:hover { background: #fef2f2; color: #ef4444; }
    }

    .config-card__members { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .config-card__member-chip {
      font-size: 11px; font-weight: 500; padding: 2px 10px; border-radius: 100px;
      background: var(--surface-hover); color: var(--text-secondary); border: 1px solid var(--border-color);
    }
    .config-card__member-more {
      font-size: 11px; font-weight: 600; padding: 2px 8px; color: var(--text-tertiary);
    }

    .config-form__members {
      margin-bottom: 16px;
      > label { font-size: 13px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 8px; }
    }
    .members-search {
      margin-bottom: 8px;
      input {
        width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm);
        font-size: 13px; font-family: inherit; background: var(--surface-card); color: var(--text-primary);
        outline: none;
        &:focus { border-color: var(--primary); }
      }
    }
    .members-list {
      max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);
      background: var(--surface-card);
    }
    .member-item {
      display: flex; align-items: center; gap: 10px; padding: 8px 12px; cursor: pointer;
      border-bottom: 1px solid var(--border-color); transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-hover); }
      input { width: auto; cursor: pointer; }
    }
    .member-item__info { flex: 1; min-width: 0; }
    .member-item__name { font-size: 13px; font-weight: 600; color: var(--text-primary); display: block; }
    .member-item__email { font-size: 12px; color: var(--text-tertiary); display: block; }
    .member-item__role {
      font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 100px;
      background: var(--primary-subtle); color: var(--primary); white-space: nowrap;
    }
    .members-empty { padding: 20px; text-align: center; color: var(--text-tertiary); font-size: 13px; }
    .members-count { font-size: 12px; color: var(--text-secondary); margin-top: 8px; font-weight: 500; }

    @media (max-width: 768px) {
      .config-form__row { grid-template-columns: 1fr; }
      .config-section__header { flex-direction: column; gap: 12px; }
    }
  `]
})
export class WorkspaceConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  workgroups = signal<Workgroup[]>([]);
  workQueues = signal<WorkQueue[]>([]);
  users = signal<User[]>([]);

  showWorkgroupForm = false;
  showQueueForm = false;
  editingWorkgroup: Workgroup | null = null;
  editingQueue: WorkQueue | null = null;

  memberSearch = '';
  wgForm = { name: '', description: '', managerId: '', memberIds: [] as string[] };
  queueForm = { name: '', description: '', workgroupId: '', priority: 0, autoAssign: false, maxCapacity: null as number | null };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.get<any>('/workspace/workgroups').subscribe({
      next: (res) => this.workgroups.set(res.data || []),
      error: () => {}
    });
    this.api.get<any>('/workspace/work-queues').subscribe({
      next: (res) => this.workQueues.set(res.data || []),
      error: () => {}
    });
    this.api.get<any>('/auth/users').subscribe({
      next: (res) => this.users.set(res.data || []),
      error: () => {}
    });
  }

  activeUsers(): User[] {
    return this.users().filter(u => u.is_active !== false);
  }

  filteredUsers(): User[] {
    const all = this.activeUsers();
    if (!this.memberSearch) return all;
    const q = this.memberSearch.toLowerCase();
    return all.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }

  toggleMember(userId: string): void {
    const ids = this.wgForm.memberIds;
    const idx = ids.indexOf(userId);
    if (idx >= 0) {
      ids.splice(idx, 1);
    } else {
      ids.push(userId);
    }
  }

  getUserName(userId: string): string {
    const u = this.users().find(u => u.id === userId);
    return u?.name || u?.email || userId.slice(0, 8);
  }

  getManagerName(managerId: string | null): string {
    if (!managerId) return '';
    return this.getUserName(managerId);
  }

  resetWorkgroupForm(): void { this.wgForm = { name: '', description: '', managerId: '', memberIds: [] }; }
  resetQueueForm(): void { this.queueForm = { name: '', description: '', workgroupId: '', priority: 0, autoAssign: false, maxCapacity: null }; }

  editWorkgroup(wg: Workgroup): void {
    this.editingWorkgroup = wg;
    this.wgForm = { name: wg.name, description: wg.description, managerId: wg.manager_id || '', memberIds: [...(wg.member_ids || [])] };
    this.memberSearch = '';
    this.showWorkgroupForm = true;
  }

  saveWorkgroup(): void {
    const payload: Record<string, any> = { name: this.wgForm.name, description: this.wgForm.description, managerId: this.wgForm.managerId || null, memberIds: this.wgForm.memberIds };
    const req$ = this.editingWorkgroup
      ? this.api.patch<any>(`/workspace/workgroups/${this.editingWorkgroup.id}`, payload)
      : this.api.post<any>('/workspace/workgroups', payload);

    req$.subscribe({
      next: () => { this.showWorkgroupForm = false; this.loadData(); this.toast.success('Workgroup saved'); },
      error: () => this.toast.error('Failed to save workgroup')
    });
  }

  deleteWorkgroup(wg: Workgroup): void {
    this.toast.confirmDelete(wg.name).subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete<any>(`/workspace/workgroups/${wg.id}`).subscribe({
        next: () => { this.loadData(); this.toast.success('Workgroup deleted'); },
        error: () => this.toast.error('Failed to delete workgroup')
      });
    });
  }

  editQueue(q: WorkQueue): void {
    this.editingQueue = q;
    this.queueForm = { name: q.name, description: q.description, workgroupId: q.workgroup_id, priority: q.priority, autoAssign: q.auto_assign, maxCapacity: q.max_capacity };
    this.showQueueForm = true;
  }

  saveQueue(): void {
    const payload = { name: this.queueForm.name, description: this.queueForm.description, workgroupId: this.queueForm.workgroupId, priority: this.queueForm.priority, autoAssign: this.queueForm.autoAssign, maxCapacity: this.queueForm.maxCapacity };
    const req$ = this.editingQueue
      ? this.api.patch<any>(`/workspace/work-queues/${this.editingQueue.id}`, payload)
      : this.api.post<any>('/workspace/work-queues', payload);

    req$.subscribe({
      next: () => { this.showQueueForm = false; this.loadData(); this.toast.success('Queue saved'); },
      error: () => this.toast.error('Failed to save queue')
    });
  }

  deleteQueue(q: WorkQueue): void {
    this.toast.confirmDelete(q.name).subscribe(confirmed => {
      if (!confirmed) return;
      this.api.delete<any>(`/workspace/work-queues/${q.id}`).subscribe({
        next: () => { this.loadData(); this.toast.success('Queue deleted'); },
        error: () => this.toast.error('Failed to delete queue')
      });
    });
  }

  getWorkgroupName(id: string): string {
    return this.workgroups().find(w => w.id === id)?.name || 'Unknown';
  }
}
