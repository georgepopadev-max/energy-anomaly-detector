package com.portafolio.energy.ml;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class AnomalyDetectionService {

    private static final double Z_SCORE_THRESHOLD = 2.5;
    private static final double IQR_MULTIPLIER = 1.5;
    private static final double CRITICAL_THRESHOLD = 0.7;
    private static final double WARNING_THRESHOLD = 0.4;

    public double computeAnomalyScore(double consumption, double mean, double stdDev, double q1, double q3, double[] recentValues) {
        double zScore = computeZScore(consumption, mean, stdDev);
        double iqrScore = computeIQRScore(consumption, q1, q3);
        double isolationScore = computeIsolationForestScore(consumption, recentValues);

        double combinedScore = (Math.abs(zScore) * 0.3 + iqrScore * 0.3 + isolationScore * 0.4);
        
        return Math.min(1.0, Math.max(0.0, combinedScore));
    }

    public double computeZScore(double value, double mean, double stdDev) {
        if (stdDev == 0) {
            return 0.0;
        }
        return (value - mean) / stdDev;
    }

    public double computeIQRScore(double value, double q1, double q3) {
        double iqr = q3 - q1;
        double lowerBound = q1 - IQR_MULTIPLIER * iqr;
        double upperBound = q3 + IQR_MULTIPLIER * iqr;
        
        if (value < lowerBound || value > upperBound) {
            double deviation = Math.max(value - upperBound, lowerBound - value);
            double normalizedDeviation = deviation / iqr;
            return Math.min(1.0, normalizedDeviation);
        }
        return 0.0;
    }

    public double computeIsolationForestScore(double value, double[] recentValues) {
        if (recentValues == null || recentValues.length < 10) {
            return computeZScore(value, getMean(recentValues), getStdDev(recentValues));
        }

        try {
            int numTrees = 100;
            int sampleSize = Math.min(recentValues.length, 256);
            double[] isolationScores = new double[recentValues.length];
            
            for (int i = 0; i < numTrees; i++) {
                int[] indices = new int[sampleSize];
                for (int j = 0; j < sampleSize; j++) {
                    indices[j] = (int) (Math.random() * recentValues.length);
                }
                
                double min = Double.MAX_VALUE;
                double max = Double.MIN_VALUE;
                for (int idx : indices) {
                    min = Math.min(min, recentValues[idx]);
                    max = Math.max(max, recentValues[idx]);
                }
                
                if (max != min) {
                    double normalizedValue = (value - min) / (max - min);
                    double normalizedTarget = (recentValues[indices[0]] - min) / (max - min);
                    double pathLength = Math.abs(normalizedValue - normalizedTarget) + 1;
                    isolationScores[indices[0]] += pathLength;
                }
            }
            
            double avgPathLength = 0;
            for (double s : isolationScores) {
                avgPathLength += s;
            }
            avgPathLength /= (recentValues.length * numTrees);
            
            double anomalyScore = 2.0 / (1.0 + Math.exp(-avgPathLength / 10.0)) - 1.0;
            return Math.min(1.0, Math.max(0.0, anomalyScore));
            
        } catch (Exception e) {
            log.warn("Isolation forest computation failed, falling back to z-score: {}", e.getMessage());
            return computeZScore(value, getMean(recentValues), getStdDev(recentValues));
        }
    }

    public String determineSeverity(double score) {
        if (score >= CRITICAL_THRESHOLD) {
            return "CRITICAL";
        } else if (score >= WARNING_THRESHOLD) {
            return "WARNING";
        } else {
            return "INFO";
        }
    }

    public String generateAnomalyDescription(double consumption, double baseline, double score) {
        double percentAboveBaseline = ((consumption - baseline) / baseline) * 100;
        
        if (percentAboveBaseline > 0) {
            return String.format("Consumption spike %.0f%% above baseline (%.2f kWh vs %.2f kWh baseline)", 
                    percentAboveBaseline, consumption, baseline);
        } else {
            return String.format("Consumption drop %.0f%% below baseline (%.2f kWh vs %.2f kWh baseline)", 
                    Math.abs(percentAboveBaseline), consumption, baseline);
        }
    }

    private double getMean(double[] values) {
        if (values == null || values.length == 0) {
            return 0.0;
        }
        double sum = 0.0;
        for (double v : values) {
            sum += v;
        }
        return sum / values.length;
    }

    private double getStdDev(double[] values) {
        if (values == null || values.length < 2) {
            return 1.0;
        }
        double mean = getMean(values);
        double sumSquaredDiff = 0.0;
        for (double v : values) {
            sumSquaredDiff += (v - mean) * (v - mean);
        }
        double variance = sumSquaredDiff / (values.length - 1);
        return Math.sqrt(variance);
    }
}
