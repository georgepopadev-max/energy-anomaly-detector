import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService, EnergyReading, AnomalyEvent, DashboardStats } from '../../core/api.service';
import { RealtimeService } from '../../core/realtime.service';
import { StatCardComponent, ChartCardComponent, DemoBannerComponent } from '../../shared/components';
import { AnomalyListComponent } from '../../features/anomalies/anomaly-list.component';
import { AnomalyDetailComponent } from '../../features/anomalies/anomaly-detail.component';
import { MOCK_STATS, MOCK_ANOMALIES, MOCK_ENERGY_READINGS } from '../../core/mock-data';
import * as echarts from 'echarts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    ChartCardComponent,
    DemoBannerComponent,
    AnomalyListComponent,
    AnomalyDetailComponent
  ],
  template: `
    <div class="app-container">
      <app-demo-banner></app-demo-banner>
      
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
          <div class="status-indicator" [class.connected]="connectionStatus() === 'connected'"></div>
          <span>{{ connectionStatus() === 'connected' ? 'Live Updates Active' : 'System Online' }}</span>
        </div>
      </header>
      
      <main class="main-content">
        <div class="dashboard-grid">
          <app-stat-card 
            label="Total Consumption (7 days)" 
            subtitle="Aggregated energy usage"
            [warning]="false"
            [critical]="false">
            {{ stats()?.totalConsumptionMwh | number:'1.2-2' }} MWh
          </app-stat-card>
          
          <app-stat-card 
            label="Active Anomalies" 
            subtitle="Requiring attention"
            [warning]="(stats()?.activeAnomalies ?? 0) > 5"
            [critical]="(stats()?.activeAnomalies ?? 0) > 10">
            {{ stats()?.activeAnomalies }}
          </app-stat-card>
          
          <app-stat-card 
            label="Grid Health Score" 
            subtitle="Overall system status"
            [warning]="(stats()?.gridHealthPercent ?? 100) < 90"
            [critical]="(stats()?.gridHealthPercent ?? 100) < 80">
            {{ stats()?.gridHealthPercent | number:'1.0-0' }}%
          </app-stat-card>
          
          <app-stat-card 
            label="Anomalous Readings" 
            subtitle="Of total readings"
            [warning]="(stats()?.percentAnomalous ?? 0) > 5"
            [critical]="(stats()?.percentAnomalous ?? 0) > 10">
            {{ stats()?.percentAnomalous | number:'1.1-1' }}%
          </app-stat-card>
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
          
          <app-anomaly-list 
            [anomalies]="anomalies()"
            (select)="onAnomalySelect($event)">
          </app-anomaly-list>
        </div>
      </main>
      
      @if (selectedAnomaly()) {
        <app-anomaly-detail 
          [anomaly]="selectedAnomaly()!"
          (close)="closeAnomalyDetail()"
          (resolve)="onResolveAnomaly($event)">
        </app-anomaly-detail>
      }
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #0f1423;
      color: #ffffff;
    }
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 20, 35, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      z-index: 100;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #2a3158;
      border-top-color: #00a8e8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-text {
      color: #a0a8c8;
      font-size: 0.9rem;
    }
    .error-banner {
      background: rgba(255, 61, 113, 0.1);
      border: 1px solid #ff3d71;
      border-radius: 8px;
      padding: 16px;
      color: #ff3d71;
      margin-bottom: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1a1f3a 0%, #252b4a 100%);
      border-bottom: 1px solid #2a3158;
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      font-size: 1.8rem;
    }
    .header-title h1 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: #ffffff;
    }
    .header-status {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #a0a8c8;
      font-size: 0.85rem;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6b7280;
    }
    .status-indicator.connected {
      background: #00d68f;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .main-content {
      padding: 24px 32px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    @media (max-width: 1024px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
    }
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
    .chart-controls button {
      background: rgba(42, 49, 88, 0.5);
      border: 1px solid #2a3158;
      color: #a0a8c8;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chart-controls button:hover {
      background: rgba(42, 49, 88, 0.8);
      color: #ffffff;
    }
    .chart-controls button.active {
      background: #00a8e8;
      border-color: #00a8e8;
      color: #ffffff;
    }
    .chart-container {
      width: 100%;
      height: 300px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private realtimeService = inject(RealtimeService);
  
  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  anomalies = signal<AnomalyEvent[]>([]);
  readings = signal<EnergyReading[]>([]);
  chartRange = signal(168);
  selectedAnomaly = signal<AnomalyEvent | null>(null);
  connectionStatus = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  private chart: echarts.ECharts | null = null;
  private chartContainer: HTMLElement | null = null;
  private realtimeSubscription: any = null;
  
  ngOnInit() {
    this.loading.set(true);
    this.error.set(null);
    
    // Initialize data
    this.api.initializeData().subscribe({
      next: () => {},
      complete: () => this.loadData()
    });
    
    // Start mock WebSocket for real-time updates
    this.realtimeService.connect();
    this.realtimeSubscription = this.realtimeService.connectionStatus$.subscribe(
      status => this.connectionStatus.set(status)
    );
    
    // Subscribe to new readings for live chart updates
    this.realtimeService.latestReading$.subscribe(reading => {
      if (reading) {
        this.onNewReading(reading);
      }
    });
  }
  
  ngOnDestroy() {
    this.realtimeService.disconnect();
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
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
      console.warn('API fetch failed, using mock data:', err.message);
      this.stats.set(MOCK_STATS);
      this.anomalies.set(MOCK_ANOMALIES.filter(a => a.resolvedAt === null));
      this.readings.set(MOCK_ENERGY_READINGS);
      setTimeout(() => this.initChart(), 100);
    }
    
    this.loading.set(false);
  }
  
  onNewReading(reading: EnergyReading) {
    // Add new reading to the list and update chart
    const current = this.readings();
    const updated = [...current, reading];
    this.readings.set(updated);
    
    // Update stats if significant change
    if (reading.anomalyScore > 0.5) {
      const currentStats = this.stats();
      if (currentStats) {
        this.stats.set({
          ...currentStats,
          activeAnomalies: currentStats.activeAnomalies + 1,
          percentAnomalous: currentStats.percentAnomalous + 0.01
        });
      }
    }
    
    this.updateChart();
  }
  
  setChartRange(hours: number) {
    this.chartRange.set(hours);
    this.api.getConsumption(hours).subscribe(readings => {
      this.readings.set(readings || []);
      this.updateChart();
    });
  }
  
  onAnomalySelect(anomaly: AnomalyEvent) {
    this.selectedAnomaly.set(anomaly);
  }
  
  closeAnomalyDetail() {
    this.selectedAnomaly.set(null);
  }
  
  onResolveAnomaly(anomalyId: string) {
    const current = this.anomalies();
    const updated = current.map(a => 
      a.id === anomalyId ? { ...a, resolvedAt: new Date().toISOString() } : a
    );
    this.anomalies.set(updated);
    this.selectedAnomaly.set(null);
    
    // Update stats
    const currentStats = this.stats();
    if (currentStats) {
      this.stats.set({
        ...currentStats,
        activeAnomalies: Math.max(0, currentStats.activeAnomalies - 1),
        alertsResolvedToday: currentStats.alertsResolvedToday + 1
      });
    }
    
    this.api.resolveAnomaly(anomalyId).subscribe();
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
