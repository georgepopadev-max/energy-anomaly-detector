import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, EnergyReading, AnomalyEvent, DashboardStats } from './services/api.service';
import * as echarts from 'echarts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-container">
      @if (loading()) {
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
          <div class="loading-text">Initializing energy monitoring system...</div>
        </div>
      }
      
      @if (error()) {
        <div class="main-content">
          <div class="error-banner">
            Error: {{ error() }}
          </div>
        </div>
      }
      
      <header class="header">
        <div class="header-title">
          <div class="logo">⚡</div>
          <h1>Energy Anomaly Detector</h1>
        </div>
        <div class="header-status">
          <div class="status-indicator"></div>
          <span>System Online</span>
        </div>
      </header>
      
      <main class="main-content">
        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-card-label">Total Consumption (7 days)</div>
            <div class="stat-card-value">{{ stats()?.totalConsumptionMwh | number:'1.2-2' }} MWh</div>
            <div class="stat-card-subtitle">Aggregated energy usage</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-label">Active Anomalies</div>
            <div class="stat-card-value" [class.warning]="(stats()?.activeAnomalies ?? 0) > 5" [class.critical]="(stats()?.activeAnomalies ?? 0) > 10">
              {{ stats()?.activeAnomalies }}
            </div>
            <div class="stat-card-subtitle">Requiring attention</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-label">Grid Health Score</div>
            <div class="stat-card-value success">{{ stats()?.gridHealthPercent | number:'1.0-0' }}%</div>
            <div class="stat-card-subtitle">Overall system status</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-card-label">Anomalous Readings</div>
            <div class="stat-card-value" [class.warning]="(stats()?.percentAnomalous ?? 0) > 5" [class.critical]="(stats()?.percentAnomalous ?? 0) > 10">
              {{ stats()?.percentAnomalous | number:'1.1-1' }}%
            </div>
            <div class="stat-card-subtitle">Of total readings</div>
          </div>
        </div>
        
        <div class="main-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h2 class="chart-title">Energy Consumption Over Time</h2>
              <div class="chart-controls">
                <button (click)="setChartRange(24)" [class.active]="chartRange() === 24">24h</button>
                <button (click)="setChartRange(72)" [class.active]="chartRange() === 72">3d</button>
                <button (click)="setChartRange(168)" [class.active]="chartRange() === 168">7d</button>
              </div>
            </div>
            <div class="chart-container" #chartContainer></div>
          </div>
          
          <div class="anomaly-list-card">
            <h2 class="anomaly-list-header">Detected Anomalies</h2>
            <div class="anomaly-list">
              @for (anomaly of anomalies(); track anomaly.id) {
                <div class="anomaly-item" [class.critical]="anomaly.severity === 'CRITICAL'" [class.warning]="anomaly.severity === 'WARNING'" [class.info]="anomaly.severity === 'INFO'">
                  <div class="anomaly-item-header">
                    <span class="anomaly-source">{{ anomaly.sourceName }}</span>
                    <span class="anomaly-severity" [class.warning]="anomaly.severity === 'WARNING'" [class.info]="anomaly.severity === 'INFO'">{{ anomaly.severity }}</span>
                  </div>
                  <div class="anomaly-description">{{ anomaly.description }}</div>
                  <div class="anomaly-timestamp">{{ anomaly.detectedAt | date:'MMM d, y HH:mm' }}</div>
                  <div class="anomaly-score">Score: {{ (anomaly.score * 100) | number:'1.0-0' }}%</div>
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
        </div>
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  
  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  anomalies = signal<AnomalyEvent[]>([]);
  readings = signal<EnergyReading[]>([]);
  chartRange = signal(168);
  
  private chart: echarts.ECharts | null = null;
  private chartContainer: HTMLElement | null = null;
  
  async ngOnInit() {
    try {
      await this.api.initializeData().toPromise();
      await this.loadData();
      this.loading.set(false);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to initialize system');
      this.loading.set(false);
    }
  }
  
  async loadData() {
    try {
      const [stats, anomalies, readings] = await Promise.all([
        this.api.getStats().toPromise(),
        this.api.getAnomalies(false).toPromise(),
        this.api.getConsumption(this.chartRange()).toPromise()
      ]);
      
      this.stats.set(stats || null);
      this.anomalies.set(anomalies || []);
      this.readings.set(readings || []);
      
      setTimeout(() => this.initChart(), 100);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load data');
    }
  }
  
  setChartRange(hours: number) {
    this.chartRange.set(hours);
    this.api.getConsumption(hours).subscribe(readings => {
      this.readings.set(readings || []);
      this.updateChart();
    });
  }
  
  initChart() {
    const container = document.querySelector('.chart-container') as HTMLElement;
    if (!container) return;
    
    this.chart = echarts.init(container);
    this.updateChart();
    
    window.addEventListener('resize', () => this.chart?.resize());
  }
  
  updateChart() {
    if (!this.chart) return;
    
    const readings = this.readings();
    const sourceMap = new Map<string, { name: string; data: [string, number][] }>();
    
    readings.forEach(reading => {
      if (!sourceMap.has(reading.sourceId)) {
        sourceMap.set(reading.sourceId, { name: reading.sourceName, data: [] });
      }
      const source = sourceMap.get(reading.sourceId)!;
      const time = new Date(reading.timestamp).toISOString();
      source.data.push([time, reading.consumptionKwh]);
    });
    
    const series = Array.from(sourceMap.entries()).map(([id, source]) => ({
      name: source.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: readings.filter(r => r.sourceId === id && r.anomalyScore > 0.4).length > 0 ? 8 : 0,
      itemStyle: { color: this.getSourceColor(id) },
      data: source.data,
      markPoint: {
        symbol: 'pin',
        symbolSize: 40,
        data: readings
          .filter(r => r.sourceId === id && r.anomalyScore > 0.4)
          .map(r => ({
            coord: [new Date(r.timestamp).toISOString(), r.consumptionKwh],
            value: (r.anomalyScore * 100).toFixed(0) + '%',
            itemStyle: { color: r.anomalyScore > 0.7 ? '#ff3d71' : '#ffaa00' }
          }))
      }
    }));
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1a1f3a',
        borderColor: '#2a3158',
        textStyle: { color: '#ffffff' },
        formatter: (params: any) => {
          const time = new Date(params[0].value[0]).toLocaleString();
          let html = `<div style="font-weight:600;margin-bottom:4px">${time}</div>`;
          params.forEach((p: any) => {
            html += `<div style="margin:2px 0">${p.marker} ${p.seriesName}: <strong>${p.value[1].toFixed(2)} kWh</strong></div>`;
          });
          return html;
        }
      },
      legend: {
        show: true,
        bottom: 10,
        textStyle: { color: '#a0a8c8' },
        type: 'scroll'
      },
      grid: { left: 60, right: 30, top: 40, bottom: 60 },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: '#2a3158' } },
        axisLabel: { color: '#a0a8c8', formatter: (value: number) => new Date(value).toLocaleDateString() },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'Consumption (kWh)',
        nameTextStyle: { color: '#a0a8c8' },
        axisLine: { lineStyle: { color: '#2a3158' } },
        axisLabel: { color: '#a0a8c8' },
        splitLine: { lineStyle: { color: '#2a3158', type: 'dashed' } }
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 30, borderColor: '#2a3158', fillerColor: 'rgba(0,168,232,0.2)', handleStyle: { color: '#00a8e8' } }
      ],
      series
    };
    
    this.chart.setOption(option, true);
  }
  
  private getSourceColor(id: string): string {
    const colors = ['#00a8e8', '#ff6b35', '#00d68f', '#ffaa00', '#a855f7', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
