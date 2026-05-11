import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeverityBadgeComponent } from '../../shared/components';
import { AnomalyEvent } from '../../core/api.service';

@Component({
  selector: 'app-anomaly-detail',
  standalone: true,
  imports: [CommonModule, SeverityBadgeComponent],
  template: `
    <div class="anomaly-detail-overlay" (click)="close.emit()">
      <div class="anomaly-detail-card" (click)="$event.stopPropagation()">
        <div class="detail-header">
          <h3>Anomaly Details</h3>
          <button class="close-btn" (click)="close.emit()">×</button>
        </div>
        
        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">ID</span>
            <span class="detail-value">{{ anomaly.id }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Source</span>
            <span class="detail-value">{{ anomaly.sourceName }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Severity</span>
            <app-severity-badge [severity]="anomaly.severity"></app-severity-badge>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Anomaly Score</span>
            <span class="detail-value" [class.critical]="anomaly.score > 0.7" [class.warning]="anomaly.score > 0.4">
              {{ (anomaly.score * 100).toFixed(1) }}%
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Detected At</span>
            <span class="detail-value">{{ anomaly.detectedAt | date:'medium' }}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Reading ID</span>
            <span class="detail-value">{{ anomaly.readingId }}</span>
          </div>
          
          <div class="detail-section">
            <span class="detail-label">Description</span>
            <p class="detail-description">{{ anomaly.description }}</p>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value" [class.resolved]="anomaly.resolvedAt">
              {{ anomaly.resolvedAt ? 'Resolved' : 'Active' }}
            </span>
          </div>
          
          <div class="detail-row" *ngIf="anomaly.resolvedAt">
            <span class="detail-label">Resolved At</span>
            <span class="detail-value">{{ anomaly.resolvedAt | date:'medium' }}</span>
          </div>
        </div>
        
        <div class="detail-footer" *ngIf="!anomaly.resolvedAt">
          <button class="resolve-btn" (click)="resolve.emit(anomaly.id)">Mark as Resolved</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .anomaly-detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .anomaly-detail-card {
      background: #1a1f3a;
      border: 1px solid #2a3158;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #2a3158;
    }
    .detail-header h3 {
      margin: 0;
      color: #ffffff;
      font-size: 1.1rem;
    }
    .close-btn {
      background: none;
      border: none;
      color: #a0a8c8;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .close-btn:hover { color: #ffffff; }
    .detail-body { padding: 20px; }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #252b4a;
    }
    .detail-label {
      color: #a0a8c8;
      font-size: 0.85rem;
    }
    .detail-value {
      color: #ffffff;
      font-weight: 500;
    }
    .detail-value.warning { color: #ffaa00; }
    .detail-value.critical { color: #ff3d71; }
    .detail-value.resolved { color: #00d68f; }
    .detail-section {
      padding: 12px 0;
      border-bottom: 1px solid #252b4a;
    }
    .detail-description {
      color: #ffffff;
      margin: 8px 0 0 0;
      line-height: 1.5;
    }
    .detail-footer {
      padding: 16px 20px;
      border-top: 1px solid #2a3158;
    }
    .resolve-btn {
      width: 100%;
      padding: 12px;
      background: #00a8e8;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .resolve-btn:hover { background: #0095c7; }
  `]
})
export class AnomalyDetailComponent {
  @Input() anomaly!: AnomalyEvent;
  @Output() close = new EventEmitter<void>();
  @Output() resolve = new EventEmitter<string>();
}
