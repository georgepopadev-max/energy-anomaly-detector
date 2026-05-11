import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { USE_MOCK_DATA, MOCK_MODE_BANNER_MESSAGE } from '../../shared/constants';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (USE_MOCK_DATA) {
      <div class="demo-banner">
        <span class="demo-icon">🔧</span>
        <span class="demo-text">{{ MOCK_MODE_BANNER_MESSAGE }}</span>
      </div>
    }
  `,
  styles: [`
    .demo-banner {
      background: linear-gradient(90deg, #ff6b35 0%, #ff8c5a 100%);
      color: #ffffff;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .demo-icon {
      font-size: 1rem;
    }
    .demo-text {
      letter-spacing: 0.3px;
    }
  `]
})
export class DemoBannerComponent {
  readonly USE_MOCK_DATA = USE_MOCK_DATA;
  readonly MOCK_MODE_BANNER_MESSAGE = MOCK_MODE_BANNER_MESSAGE;
}
