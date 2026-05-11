import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  MOCK_STATS,
  MOCK_ANOMALIES,
  MOCK_ENERGY_READINGS,
  MOCK_DATA_SOURCES
} from './mock-data';

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
  private apiUrl = this.getApiUrl();
  private readonly TIMEOUT_MS = 5000;

  private getApiUrl(): string {
    // Try Vercel environment variable first, then fallback to relative path
    if (typeof window !== 'undefined') {
      const vercelUrl = (window as any).__VERCEL_ENV__?.API_URL_BACK;
      if (vercelUrl) return vercelUrl;
      // Fallback: use same origin for API calls
      return window.location.origin;
    }
    return '';
  }

  private handleError<T>(fallback: T) {
    return (error: HttpErrorResponse | Error): Observable<T> => {
      console.warn(`API call failed, using mock data: ${error.message || 'Unknown error'}`);
      return of(fallback);
    };
  }

  initializeData(): Observable<any> {
    return this.http.post(`${this.apiUrl}/init`, {}).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError({ success: true, message: 'Mock init completed' }))
    );
  }

  getConsumption(hours: number = 168): Observable<EnergyReading[]> {
    return this.http.get<EnergyReading[]>(`${this.apiUrl}/consumption?hours=${hours}`).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError(
        MOCK_ENERGY_READINGS.filter(r => {
          const readingTime = new Date(r.timestamp).getTime();
          const now = Date.now();
          const cutoff = now - hours * 60 * 60 * 1000;
          return readingTime >= cutoff;
        })
      ))
    );
  }

  getAnomalies(activeOnly: boolean = false): Observable<AnomalyEvent[]> {
    return this.http.get<AnomalyEvent[]>(`${this.apiUrl}/anomalies?activeOnly=${activeOnly}`).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError(
        activeOnly
          ? MOCK_ANOMALIES.filter(a => a.resolvedAt === null)
          : MOCK_ANOMALIES
      ))
    );
  }

  resolveAnomaly(anomalyId: string): Observable<AnomalyEvent[]> {
    return this.http.post<AnomalyEvent[]>(`${this.apiUrl}/anomalies/${anomalyId}/resolve`, {}).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError(MOCK_ANOMALIES))
    );
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError(MOCK_STATS))
    );
  }

  getDataSources(): Observable<DataSource[]> {
    return this.http.get<DataSource[]>(`${this.apiUrl}/sources`).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError(MOCK_DATA_SOURCES))
    );
  }

  generateRealtimeReading(sourceId: string): Observable<EnergyReading> {
    return this.http.get<EnergyReading>(`${this.apiUrl}/anomalies/realtime?sourceId=${sourceId}`).pipe(
      timeout(this.TIMEOUT_MS),
      catchError(this.handleError(
        MOCK_ENERGY_READINGS.find(r => r.sourceId === sourceId) || MOCK_ENERGY_READINGS[0]
      ))
    );
  }
}
