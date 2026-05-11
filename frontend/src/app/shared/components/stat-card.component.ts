import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [class.warning]="warning" [class.critical]="critical">
      <div class="stat-card-label">{{ label }}</div>
      <div class="stat-card-value" [class.warning]="warning" [class.critical]="critical">
        <ng-content></ng-content>
      </div>
      <div class="stat-card-subtitle">{{ subtitle }}</div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: linear-gradient(135deg, #1a1f3a 0%, #252b4a 100%);
      border: 1px solid #2a3158;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .stat-card-label {
      font-size: 0.85rem;
      color: #a0a8c8;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-card-value {
      font-size: 2rem;
      font-weight: 700;
      color: #00a8e8;
    }
    .stat-card-value.warning { color: #ffaa00; }
    .stat-card-value.critical { color: #ff3d71; }
    .stat-card-subtitle {
      font-size: 0.8rem;
      color: #6b7280;
    }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() subtitle = '';
  @Input() warning = false;
  @Input() critical = false;
}
