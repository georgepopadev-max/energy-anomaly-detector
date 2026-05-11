import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as echarts from 'echarts';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="chart-header">
        <h2 class="chart-title">{{ title }}</h2>
        <div class="chart-controls" *ngIf="showControls">
          <ng-content select="[chart-controls]"></ng-content>
        </div>
      </div>
      <div class="chart-container" #chartContainer></div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: linear-gradient(135deg, #1a1f3a 0%, #252b4a 100%);
      border: 1px solid #2a3158;
      border-radius: 12px;
      padding: 20px;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .chart-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
    }
    .chart-controls {
      display: flex;
      gap: 8px;
    }
    .chart-container {
      width: 100%;
      height: 300px;
    }
  `]
})
export class ChartCardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @Input() title = 'Chart';
  @Input() showControls = false;
  @Output() chartReady = new EventEmitter<echarts.ECharts>();

  private chart: echarts.ECharts | null = null;

  ngAfterViewInit() {
    setTimeout(() => this.initChart(), 50);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  private initChart() {
    if (!this.chartContainer?.nativeElement) return;
    this.chart = echarts.init(this.chartContainer.nativeElement);
    this.chartReady.emit(this.chart);
    window.addEventListener('resize', () => this.chart?.resize());
  }

  getChart(): echarts.ECharts | null {
    return this.chart;
  }
}
