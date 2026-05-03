import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnergyReading {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  timestamp: string;
  consumptionKwh: number;
  voltage: number;
  frequency: number;
  anomalyScore: number;
}

export interface AnomalyEvent {
  id: string;
  readingId: string;
  sourceId: string;
  sourceName: string;
  timestamp: string;
  score: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface DashboardStats {
  totalConsumptionMwh: number;
  anomalyCount: number;
  gridHealthPercent: number;
  alertsResolvedToday: number;
  activeAnomalies: number;
  percentAnomalous: number;
}

export interface DataSource {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  initializeData(): Observable<any> {
    return this.http.get('/api/init');
  }

  getConsumption(hours: number = 168): Observable<EnergyReading[]> {
    return this.http.get<EnergyReading[]>(`/api/consumption?hours=${hours}`);
  }

  getAnomalies(activeOnly: boolean = false): Observable<AnomalyEvent[]> {
    return this.http.get<AnomalyEvent[]>(`/api/anomalies?activeOnly=${activeOnly}`);
  }

  resolveAnomaly(anomalyId: string): Observable<AnomalyEvent[]> {
    return this.http.post<AnomalyEvent[]>(`/api/anomalies/${anomalyId}/resolve`, {});
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/api/stats');
  }

  getDataSources(): Observable<DataSource[]> {
    return this.http.get<DataSource[]>('/api/sources');
  }

  generateRealtimeReading(sourceId: string): Observable<EnergyReading> {
    return this.http.get<EnergyReading>(`/api/anomalies/realtime?sourceId=${sourceId}`);
  }
}
