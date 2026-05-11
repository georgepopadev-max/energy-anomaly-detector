import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="severity-badge" [class.critical]="severity === 'CRITICAL'" [class.warning]="severity === 'WARNING'" [class.info]="severity === 'INFO'">
      {{ severity }}
    </span>
  `,
  styles: [`
    .severity-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .severity-badge.critical {
      background: rgba(255, 61, 113, 0.2);
      color: #ff3d71;
      border: 1px solid #ff3d71;
    }
    .severity-badge.warning {
      background: rgba(255, 170, 0, 0.2);
      color: #ffaa00;
      border: 1px solid #ffaa00;
    }
    .severity-badge.info {
      background: rgba(0, 168, 232, 0.2);
      color: #00a8e8;
      border: 1px solid #00a8e8;
    }
  `]
})
export class SeverityBadgeComponent {
  @Input() severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';
}
