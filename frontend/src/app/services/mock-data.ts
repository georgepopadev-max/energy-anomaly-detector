import { DashboardStats, EnergyReading, AnomalyEvent, DataSource } from './api.service';

export const MOCK_DATA_SOURCES: DataSource[] = [
  {
    id: 'src-001',
    name: 'Main Grid Meter',
    type: 'smart_meter',
    location: 'Building A - Electrical Room',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'src-002',
    name: 'Substation Alpha',
    type: 'substation',
    location: 'Industrial Zone North',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'src-003',
    name: 'Solar Array Monitor',
    type: 'renewable_meter',
    location: 'Rooftop Installation',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'src-004',
    name: 'HVAC Consumption Meter',
    type: 'smart_meter',
    location: 'Building B - HVAC Room',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'src-005',
    name: 'Data Center PDU',
    type: 'submeter',
    location: 'Data Center Floor 2',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const MOCK_STATS: DashboardStats = {
  totalConsumptionMwh: 847.32,
  anomalyCount: 12,
  gridHealthPercent: 94,
  alertsResolvedToday: 8,
  activeAnomalies: 12,
  percentAnomalous: 3.2
};

function generateMockReadings(): EnergyReading[] {
  const readings: EnergyReading[] = [];
  const sources = MOCK_DATA_SOURCES;
  const now = Date.now();
  const hoursBack = 168; // 7 days

  for (let h = hoursBack; h >= 0; h--) {
    const timestamp = new Date(now - h * 60 * 60 * 1000);
    const hourOfDay = timestamp.getHours();

    sources.forEach((source, sourceIdx) => {
      const baseConsumption = getBaseConsumption(source.type, hourOfDay);
      const variance = (Math.random() - 0.5) * baseConsumption * 0.2;

      // Add some anomaly spikes
      let anomalyScore = Math.random() < 0.032 ? Math.random() * 0.5 + 0.5 : Math.random() * 0.2;
      if (h % 47 === 0) anomalyScore = 0.85; // Periodic spike
      if (h % 73 === 0) anomalyScore = 0.72;

      readings.push({
        id: `reading-${h}-${source.id}`,
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        timestamp: timestamp.toISOString(),
        consumptionKwh: Math.max(0, baseConsumption + variance),
        voltage: 220 + (Math.random() - 0.5) * 20,
        frequency: 50 + (Math.random() - 0.5) * 2,
        anomalyScore
      });
    });
  }

  return readings;
}

function getBaseConsumption(sourceType: string, hourOfDay: number): number {
  const patterns: Record<string, number[]> = {
    smart_meter: [15, 12, 10, 9, 10, 12, 18, 35, 45, 42, 40, 38, 42, 45, 44, 43, 40, 38, 35, 32, 28, 25, 20, 17],
    substation: [80, 75, 72, 70, 72, 75, 85, 120, 150, 145, 140, 138, 142, 145, 143, 140, 135, 125, 110, 100, 95, 90, 85, 82],
    renewable_meter: [0, 0, 0, 0, 0, 0, 5, 25, 55, 75, 85, 90, 88, 85, 80, 65, 45, 20, 5, 0, 0, 0, 0, 0],
    submeter: [25, 23, 22, 21, 22, 23, 28, 45, 55, 54, 52, 50, 52, 54, 53, 52, 50, 48, 42, 38, 34, 30, 28, 26]
  };

  const pattern = patterns[sourceType] || patterns['smart_meter'];
  return pattern[hourOfDay];
}

function generateMockAnomalies(): AnomalyEvent[] {
  const anomalies: AnomalyEvent[] = [];
  const severities: ('CRITICAL' | 'WARNING' | 'INFO')[] = ['CRITICAL', 'WARNING', 'INFO'];
  const descriptions = [
    'Sudden voltage spike detected - potential equipment malfunction',
    'Unusual consumption pattern - exceeds historical baseline by 45%',
    'Frequency deviation detected - grid instability warning',
    'Power factor anomaly - reactive power imbalance detected',
    'Consumption surge at off-peak hours - requires investigation',
    'Voltage sag detected - possible transformer issue',
    'Harmonic distortion levels exceeding IEEE standards',
    'Rapid load fluctuation detected - possible fault condition',
    'Consumption drop during peak hours - sensor malfunction suspected',
    'Temperature anomaly in electrical panel - fire risk assessment needed',
    'Intermittent connectivity issues with smart meter',
    'Unbalanced phase loading detected in substation',
    'Suspicious consumption pattern - potential energy theft indicator',
    'Transformer overload warning - load redistribution recommended'
  ];

  const now = Date.now();
  const activeAnomalyCount = 12;

  for (let i = 0; i < activeAnomalyCount; i++) {
    const hoursAgo = Math.floor(Math.random() * 72) + 1;
    const sourceIdx = Math.floor(Math.random() * MOCK_DATA_SOURCES.length);
    const source = MOCK_DATA_SOURCES[sourceIdx];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    anomalies.push({
      id: `anomaly-${i + 1}`,
      readingId: `reading-${hoursAgo}-${source.id}`,
      sourceId: source.id,
      sourceName: source.name,
      timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
      score: severity === 'CRITICAL' ? 0.85 + Math.random() * 0.15 : severity === 'WARNING' ? 0.6 + Math.random() * 0.25 : 0.3 + Math.random() * 0.3,
      severity,
      description: descriptions[i % descriptions.length],
      detectedAt: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
      resolvedAt: null
    });
  }

  // Add some resolved anomalies
  for (let i = 0; i < 8; i++) {
    const hoursAgo = Math.floor(Math.random() * 48) + 24;
    const sourceIdx = Math.floor(Math.random() * MOCK_DATA_SOURCES.length);
    const source = MOCK_DATA_SOURCES[sourceIdx];
    const detectedAt = new Date(now - hoursAgo * 60 * 60 * 1000);

    anomalies.push({
      id: `anomaly-resolved-${i + 1}`,
      readingId: `reading-${hoursAgo + 2}-${source.id}`,
      sourceId: source.id,
      sourceName: source.name,
      timestamp: detectedAt.toISOString(),
      score: 0.5 + Math.random() * 0.4,
      severity: 'INFO',
      description: 'Historical anomaly - ' + descriptions[i % descriptions.length],
      detectedAt: detectedAt.toISOString(),
      resolvedAt: new Date(now - (hoursAgo - 2) * 60 * 60 * 1000).toISOString()
    });
  }

  return anomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const MOCK_ENERGY_READINGS: EnergyReading[] = generateMockReadings();
export const MOCK_ANOMALIES: AnomalyEvent[] = generateMockAnomalies();
