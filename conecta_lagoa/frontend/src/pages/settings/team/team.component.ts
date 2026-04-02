import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    TranslateModule,
  ],
  template: `
    <div>
      <!-- Invite form -->
      <div class="card mb-lg">
        <h3 class="card__title mb-md">{{ 'TEAM.INVITE_TITLE' | translate }}</h3>
        <p class="text-sm mb-lg" style="color: var(--text-secondary)">{{ 'TEAM.INVITE_DESC' | translate }}</p>

        <div class="grid grid--4 mb-md" style="align-items: start;">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'TEAM.FIRST_NAME' | translate }}</mat-label>
            <input matInput [(ngModel)]="inviteFirstName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'TEAM.LAST_NAME' | translate }}</mat-label>
            <input matInput [(ngModel)]="inviteLastName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'TEAM.EMAIL' | translate }}</mat-label>
            <input matInput type="email" [(ngModel)]="inviteEmail" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'TEAM.ROLE' | translate }}</mat-label>
            <mat-select [(ngModel)]="inviteRole">
              <mat-option value="admin">{{ 'TEAM.ROLE_ADMIN' | translate }}</mat-option>
              <mat-option value="manager">{{ 'TEAM.ROLE_MANAGER' | translate }}</mat-option>
              <mat-option value="agent">{{ 'TEAM.ROLE_AGENT' | translate }}</mat-option>
              <mat-option value="viewer">{{ 'TEAM.ROLE_VIEWER' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <button mat-flat-button color="primary" (click)="inviteUser()" [disabled]="inviting()">
          <mat-icon>person_add</mat-icon>
          {{ 'TEAM.INVITE_BTN' | translate }}
        </button>
      </div>

      <!-- Team list -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;" class="mb-lg">
          <h3 class="card__title">{{ 'TEAM.MEMBERS_TITLE' | translate }}</h3>
          <span class="text-sm" style="color: var(--text-secondary)">
            {{ members().length }} {{ 'TEAM.MEMBERS_COUNT' | translate }}
          </span>
        </div>

        @if (loading()) {
          <p class="text-sm" style="color: var(--text-secondary)">{{ 'COMMON.LOADING' | translate }}</p>
        } @else if (members().length === 0) {
          <p class="text-sm" style="color: var(--text-secondary)">{{ 'TEAM.NO_MEMBERS' | translate }}</p>
        } @else {
          <div class="team__list">
            @for (member of members(); track member.id) {
              <div class="team__member" [class.team__member--inactive]="!member.isActive">
                <div class="team__avatar">
                  {{ member.firstName.charAt(0) }}{{ member.lastName.charAt(0) }}
                </div>
                <div class="team__info">
                  <div class="font-semibold">
                    {{ member.firstName }} {{ member.lastName }}
                    @if (!member.isActive) {
                      <span class="team__badge team__badge--inactive">{{ 'TEAM.INACTIVE' | translate }}</span>
                    }
                  </div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ member.email }}</div>
                </div>
                <div class="team__role">
                  <mat-form-field appearance="outline" style="width: 140px;" subscriptSizing="dynamic">
                    <mat-select [value]="member.roles[0] || 'agent'" (selectionChange)="changeRole(member, $event.value)">
                      <mat-option value="admin">{{ 'TEAM.ROLE_ADMIN' | translate }}</mat-option>
                      <mat-option value="manager">{{ 'TEAM.ROLE_MANAGER' | translate }}</mat-option>
                      <mat-option value="agent">{{ 'TEAM.ROLE_AGENT' | translate }}</mat-option>
                      <mat-option value="viewer">{{ 'TEAM.ROLE_VIEWER' | translate }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div class="team__actions">
                  <button mat-icon-button [matMenuTriggerFor]="memberMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #memberMenu="matMenu">
                    @if (member.isActive) {
                      <button mat-menu-item (click)="toggleActive(member, false)">
                        <mat-icon>person_off</mat-icon>
                        <span>{{ 'TEAM.DEACTIVATE' | translate }}</span>
                      </button>
                    } @else {
                      <button mat-menu-item (click)="toggleActive(member, true)">
                        <mat-icon>person</mat-icon>
                        <span>{{ 'TEAM.REACTIVATE' | translate }}</span>
                      </button>
                    }
                  </mat-menu>
                </div>
              </div>
              @if (!$last) {
                <mat-divider />
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .team {
      &__list {
        display: flex;
        flex-direction: column;
      }

      &__member {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 0;

        &--inactive {
          opacity: 0.5;
        }
      }

      &__avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }

      &__info {
        flex: 1;
        min-width: 0;
      }

      &__role {
        flex-shrink: 0;
      }

      &__actions {
        flex-shrink: 0;
      }

      &__badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        margin-left: 8px;
        font-weight: 500;

        &--inactive {
          background: var(--surface-hover);
          color: var(--text-secondary);
        }
      }
    }

    .grid--4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 900px) {
      .grid--4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `],
})
export class TeamComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  members = signal<TeamMember[]>([]);
  loading = signal(true);
  inviting = signal(false);

  inviteEmail = '';
  inviteFirstName = '';
  inviteLastName = '';
  inviteRole = 'agent';

  ngOnInit(): void {
    this.loadMembers();
  }

  private loadMembers(): void {
    this.loading.set(true);
    this.api.get<{ success: boolean; data: TeamMember[] }>('/auth/users').subscribe({
      next: (res) => {
        this.members.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  inviteUser(): void {
    if (!this.inviteEmail || !this.inviteFirstName || !this.inviteLastName) {
      this.snackBar.open(this.translate.instant('TEAM.FILL_ALL_FIELDS'), 'OK', { duration: 3000 });
      return;
    }

    // Check user limit before inviting
    this.inviting.set(true);
    this.api.get<{ success: boolean; data: any }>('/billing/entitlements/limit/max_users').subscribe({
      next: (res) => {
        if (res.data.overLimit && res.data.limit !== null) {
          this.snackBar.open(
            this.translate.instant('TEAM.USER_LIMIT_REACHED', { current: res.data.currentUsage, limit: res.data.limit }),
            'OK',
            { duration: 5000 }
          );
          this.inviting.set(false);
          return;
        }
        this.doInvite();
      },
      error: () => {
        // If entitlement check fails, proceed with invite (fail open)
        this.doInvite();
      },
    });
  }

  private doInvite(): void {
    this.api.post<{ success: boolean; data: TeamMember }>('/auth/invitations', {
      email: this.inviteEmail,
      firstName: this.inviteFirstName,
      lastName: this.inviteLastName,
      role: this.inviteRole,
    }).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('TEAM.INVITE_SUCCESS'), 'OK', { duration: 3000 });
        this.inviteEmail = '';
        this.inviteFirstName = '';
        this.inviteLastName = '';
        this.inviteRole = 'agent';
        this.inviting.set(false);
        this.loadMembers();
      },
      error: (err) => {
        const msg = err?.error?.error?.message || this.translate.instant('TEAM.INVITE_ERROR');
        this.snackBar.open(msg, 'OK', { duration: 4000 });
        this.inviting.set(false);
      },
    });
  }

  changeRole(member: TeamMember, newRole: string): void {
    this.api.patch(`/auth/users/${member.id}`, { role: newRole }).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('TEAM.ROLE_UPDATED'), 'OK', { duration: 3000 });
        this.loadMembers();
      },
      error: () => {
        this.snackBar.open(this.translate.instant('TEAM.ROLE_UPDATE_ERROR'), 'OK', { duration: 3000 });
      },
    });
  }

  toggleActive(member: TeamMember, activate: boolean): void {
    const endpoint = activate
      ? `/auth/users/${member.id}/reactivate`
      : `/auth/users/${member.id}/deactivate`;

    this.api.post(endpoint, {}).subscribe({
      next: () => {
        const msg = activate
          ? this.translate.instant('TEAM.USER_REACTIVATED')
          : this.translate.instant('TEAM.USER_DEACTIVATED');
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.loadMembers();
      },
      error: (err) => {
        const msg = err?.error?.error?.message || this.translate.instant('TEAM.ACTION_ERROR');
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      },
    });
  }
}
