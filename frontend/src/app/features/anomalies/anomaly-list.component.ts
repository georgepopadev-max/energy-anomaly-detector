import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnomalyEvent } from '../../core/api.service';
import { SeverityBadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-anomaly-list',
  standalone: true,
  imports: [CommonModule, SeverityBadgeComponent],
  template: `
    <div class="anomaly-list-card">
      <h2 class="anomaly-list-header">Detected Anomalies</h2>
      <div class="anomaly-list">
        @for (anomaly of anomalies; track anomaly.id) {
          <div class="anomaly-item" 
               [class.critical]="anomaly.severity === 'CRITICAL'" 
               [class.warning]="anomaly.severity === 'WARNING'" 
               [class.info]="anomaly.severity === 'INFO'"
               (click)="select.emit(anomaly)">
            <div class="anomaly-item-header">
              <span class="anomaly-source">{{ anomaly.sourceName }}</span>
              <app-severity-badge [severity]="anomaly.severity"></app-severity-badge>
            </div>
            <div class="anomaly-description">{{ anomaly.description }}</div>
            <div class="anomaly-meta">
              <span class="anomaly-timestamp">{{ anomaly.detectedAt | date:'MMM d, y HH:mm' }}</span>
              <span class="anomaly-score">Score: {{ (anomaly.score * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>
        }
        @empty {
          <div class="anomaly-item info">
            <div class="anomaly-item-header">
              <span class="anomaly-source">No anomalies detected</span>
            </div>
            <div class="anomaly-description">Grid operating within normal parameters</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .anomaly-list-card {
      background: linear-gradient(135deg, #1a1f3a 0%, #252b4a 100%);
      border: 1px solid #2a3158;
      border-radius: 12px;
      padding: 20px;
    }
    .anomaly-list-header {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 16px 0;
    }
    .anomaly-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    .anomaly-item {
      background: rgba(42, 49, 88, 0.5);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: background 0.2s;
      border-left: 3px solid transparent;
    }
    .anomaly-item:hover {
      background: rgba(42, 49, 88, 0.8);
    }
    .anomaly-item.critical { border-left-color: #ff3d71; }
    .anomaly-item.warning { border-left-color: #ffaa00; }
    .anomaly-item.info { border-left-color: #00a8e8; }
    .anomaly-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .anomaly-source {
      font-weight: 600;
      color: #ffffff;
      font-size: 0.9rem;
    }
    .anomaly-description {
      color: #a0a8c8;
      font-size: 0.85rem;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .anomaly-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6b7280;
    }
    .anomaly-score { color: #ffaa00; }
  `]
})
export class AnomalyListComponent {
  @Input() anomalies: AnomalyEvent[] = [];
  @Output() select = new EventEmitter<AnomalyEvent>();
}
