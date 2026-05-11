/**
 * Mock WebSocket Service for Real-time Updates
 * 
 * Simulates WebSocket behavior using RxJS interval observables.
 * This demonstrates how real-time updates would work with a WebSocket backend.
 * 
 * RECRUITERS: This module shows RxJS usage for streaming data.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { EnergyReading, AnomalyEvent } from '../core/api.service';
import { MOCK_DATA_SOURCES, MOCK_ANOMALIES } from '../core/mock-data';

export interface RealtimeUpdate {
  type: 'reading' | 'anomaly';
  data: EnergyReading | AnomalyEvent;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private updateSubject = new BehaviorSubject<RealtimeUpdate | null>(null);
  private subscription: Subscription | null = null;
  private isRunning = false;
  
  // Signal-based state for Angular reactivity
  private _latestReading = new BehaviorSubject<EnergyReading | null>(null);
  private _latestAnomaly = new BehaviorSubject<AnomalyEvent | null>(null);
  private _connectionStatus = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');

  readonly latestReading$ = this._latestReading.asObservable();
  readonly latestAnomaly$ = this._latestAnomaly.asObservable();
  readonly connectionStatus$ = this._connectionStatus.asObservable();
  readonly updates$ = this.updateSubject.asObservable();

  /**
   * Start mock WebSocket connection
   * Simulates receiving new readings every 3-5 seconds
   */
  connect(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this._connectionStatus.next('connecting');
    
    // Simulate connection delay
    setTimeout(() => {
      this._connectionStatus.next('connected');
      this.startMockStream();
    }, 500);
  }

  /**
   * Stop mock WebSocket connection
   */
  disconnect(): void {
    this.isRunning = false;
    this.subscription?.unsubscribe();
    this.subscription = null;
    this._connectionStatus.next('disconnected');
  }

  private startMockStream(): void {
    // Generate new reading every 3-5 seconds
    this.subscription = interval(3000 + Math.random() * 2000)
      .pipe(
        takeWhile(() => this.isRunning)
      )
      .subscribe(() => {
        const update = this.generateMockReading();
        this.updateSubject.next(update);
        
        if (update.type === 'reading') {
          this._latestReading.next(update.data as EnergyReading);
        } else {
          this._latestAnomaly.next(update.data as AnomalyEvent);
        }
      });
  }

  private generateMockReading(): RealtimeUpdate {
    const source = MOCK_DATA_SOURCES[Math.floor(Math.random() * MOCK_DATA_SOURCES.length)];
    const hourOfDay = new Date().getHours();
    
    // Base consumption patterns
    const patterns: Record<string, number[]> = {
      smart_meter: [15, 12, 10, 9, 10, 12, 18, 35, 45, 42, 40, 38, 42, 45, 44, 43, 40, 38, 35, 32, 28, 25, 20, 17],
      substation: [80, 75, 72, 70, 72, 75, 85, 120, 150, 145, 140, 138, 142, 145, 143, 140, 135, 125, 110, 100, 95, 90, 85, 82],
      renewable_meter: [0, 0, 0, 0, 0, 0, 5, 25, 55, 75, 85, 90, 88, 85, 80, 65, 45, 20, 5, 0, 0, 0, 0, 0],
      submeter: [25, 23, 22, 21, 22, 23, 28, 45, 55, 54, 52, 50, 52, 54, 53, 52, 50, 48, 42, 38, 34, 30, 28, 26]
    };
    
    const pattern = patterns[source.type] || patterns['smart_meter'];
    const baseConsumption = pattern[hourOfDay];
    const variance = (Math.random() - 0.5) * baseConsumption * 0.3;
    
    // Small chance of anomaly
    const anomalyScore = Math.random() < 0.05 ? Math.random() * 0.6 + 0.4 : Math.random() * 0.15;
    
    const reading: EnergyReading = {
      id: `realtime-${Date.now()}-${source.id}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceType: source.type,
      timestamp: new Date().toISOString(),
      consumptionKwh: Math.max(0, baseConsumption + variance),
      voltage: 220 + (Math.random() - 0.5) * 20,
      frequency: 50 + (Math.random() - 0.5) * 2,
      anomalyScore
    };

    // Occasionally generate an anomaly event
    if (anomalyScore > 0.5 && Math.random() < 0.3) {
      const severities: ('CRITICAL' | 'WARNING' | 'INFO')[] = ['CRITICAL', 'WARNING', 'INFO'];
      const descriptions = [
        'Sudden voltage spike detected - potential equipment malfunction',
        'Unusual consumption pattern - exceeds historical baseline',
        'Frequency deviation detected - grid instability warning'
      ];
      
      const anomaly: AnomalyEvent = {
        id: `anomaly-realtime-${Date.now()}`,
        readingId: reading.id,
        sourceId: source.id,
        sourceName: source.name,
        timestamp: reading.timestamp,
        score: anomalyScore,
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        detectedAt: reading.timestamp,
        resolvedAt: null
      };
      
      return { type: 'anomaly', data: anomaly, timestamp: reading.timestamp };
    }

    return { type: 'reading', data: reading, timestamp: reading.timestamp };
  }
}
