package com.portafolio.energy.service;

import com.portafolio.energy.ml.AnomalyDetectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnomalyDetectionService Unit Tests")
class AnomalyDetectionServiceTest {

    private AnomalyDetectionService anomalyDetectionService;

    @BeforeEach
    void setUp() {
        anomalyDetectionService = new AnomalyDetectionService();
    }

    @Test
    @DisplayName("Z-score calculation should correctly identify deviation from mean")
    void testComputeZScore() {
        double value = 150.0;
        double mean = 100.0;
        double stdDev = 20.0;

        double zScore = anomalyDetectionService.computeZScore(value, mean, stdDev);

        assertEquals(2.5, zScore, 0.001, "Z-score should be (150-100)/20 = 2.5");
    }

    @Test
    @DisplayName("Z-score should return 0 when stdDev is 0 to avoid division by zero")
    void testComputeZScoreWithZeroStdDev() {
        double zScore = anomalyDetectionService.computeZScore(100.0, 100.0, 0.0);

        assertEquals(0.0, zScore, "Z-score should return 0 when stdDev is 0");
    }

    @Test
    @DisplayName("Z-score should handle negative values correctly")
    void testComputeZScoreNegative() {
        double zScore = anomalyDetectionService.computeZScore(50.0, 100.0, 20.0);

        assertEquals(-2.5, zScore, 0.001, "Z-score should be (50-100)/20 = -2.5");
    }

    @Test
    @DisplayName("IQR score should detect values above upper bound")
    void testComputeIQRScoreAboveUpperBound() {
        // q1=80, q3=120, iqr=40, upperBound=120+1.5*40=180
        // value=200 is above upper bound of 180
        double value = 200.0;
        double q1 = 80.0;
        double q3 = 120.0;

        double iqrScore = anomalyDetectionService.computeIQRScore(value, q1, q3);

        assertTrue(iqrScore > 0, "Value above upper bound should have positive IQR score");
    }

    @Test
    @DisplayName("IQR score should detect values below lower bound")
    void testComputeIQRScoreBelowLowerBound() {
        // q1=80, q3=120, iqr=40, lowerBound=80-1.5*40=20
        // value=10 is below lower bound of 20
        double value = 10.0;
        double q1 = 80.0;
        double q3 = 120.0;

        double iqrScore = anomalyDetectionService.computeIQRScore(value, q1, q3);

        assertTrue(iqrScore > 0, "Value below lower bound should have positive IQR score");
    }

    @Test
    @DisplayName("IQR score should be 0 for values within bounds")
    void testComputeIQRScoreWithinBounds() {
        double value = 100.0;
        double q1 = 80.0;
        double q3 = 120.0;

        double iqrScore = anomalyDetectionService.computeIQRScore(value, q1, q3);

        assertEquals(0.0, iqrScore, 0.001, "Value within IQR bounds should have 0 score");
    }

    @Test
    @DisplayName("Combined anomaly score should be between 0 and 1")
    void testComputeAnomalyScoreRange() {
        double consumption = 200.0;
        double mean = 100.0;
        double stdDev = 20.0;
        double q1 = 80.0;
        double q3 = 120.0;
        double[] recentValues = {90.0, 95.0, 100.0, 105.0, 110.0, 85.0, 115.0, 92.0, 108.0, 98.0};

        double score = anomalyDetectionService.computeAnomalyScore(consumption, mean, stdDev, q1, q3, recentValues);

        assertTrue(score >= 0.0 && score <= 1.0, "Anomaly score should be between 0 and 1");
    }

    @Test
    @DisplayName("Combined anomaly score should be high for extreme consumption values")
    void testComputeAnomalyScoreHighForExtremeValues() {
        double consumption = 500.0;
        double mean = 100.0;
        double stdDev = 20.0;
        double q1 = 80.0;
        double q3 = 120.0;
        double[] recentValues = new double[100];
        for (int i = 0; i < 100; i++) {
            recentValues[i] = 100.0 + (Math.random() - 0.5) * 20.0;
        }

        double score = anomalyDetectionService.computeAnomalyScore(consumption, mean, stdDev, q1, q3, recentValues);

        assertTrue(score > 0.5, "Extreme consumption value should produce high anomaly score");
    }

    @Test
    @DisplayName("Severity determination should classify CRITICAL for scores >= 0.7")
    void testDetermineSeverityCritical() {
        assertEquals("CRITICAL", anomalyDetectionService.determineSeverity(0.7));
        assertEquals("CRITICAL", anomalyDetectionService.determineSeverity(0.85));
        assertEquals("CRITICAL", anomalyDetectionService.determineSeverity(1.0));
    }

    @Test
    @DisplayName("Severity determination should classify WARNING for scores >= 0.4 and < 0.7")
    void testDetermineSeverityWarning() {
        assertEquals("WARNING", anomalyDetectionService.determineSeverity(0.4));
        assertEquals("WARNING", anomalyDetectionService.determineSeverity(0.5));
        assertEquals("WARNING", anomalyDetectionService.determineSeverity(0.69));
    }

    @Test
    @DisplayName("Severity determination should classify INFO for scores < 0.4")
    void testDetermineSeverityInfo() {
        assertEquals("INFO", anomalyDetectionService.determineSeverity(0.0));
        assertEquals("INFO", anomalyDetectionService.determineSeverity(0.2));
        assertEquals("INFO", anomalyDetectionService.determineSeverity(0.39));
    }

    @Test
    @DisplayName("Anomaly description should indicate spike when consumption is above baseline")
    void testGenerateAnomalyDescriptionSpike() {
        String description = anomalyDetectionService.generateAnomalyDescription(150.0, 100.0, 0.5);

        assertTrue(description.contains("spike"), "Description should mention spike for above-baseline consumption");
        assertTrue(description.contains("50%"), "Description should contain percentage above baseline");
    }

    @Test
    @DisplayName("Anomaly description should indicate drop when consumption is below baseline")
    void testGenerateAnomalyDescriptionDrop() {
        String description = anomalyDetectionService.generateAnomalyDescription(75.0, 100.0, 0.5);

        assertTrue(description.contains("drop"), "Description should mention drop for below-baseline consumption");
    }

    @Test
    @DisplayName("Isolation forest score should return normalized score for valid input")
    void testIsolationForestWithValidValues() {
        double[] recentValues = new double[100];
        for (int i = 0; i < 100; i++) {
            recentValues[i] = 100.0 + (Math.random() - 0.5) * 40.0;  // varied baseline values
        }

        // Normal value should score low
        double normalScore = anomalyDetectionService.computeIsolationForestScore(100.0, recentValues);
        assertTrue(normalScore >= 0.0 && normalScore <= 1.0, "Should return normalized score for normal value");

        // Extreme value should score high
        double extremeScore = anomalyDetectionService.computeIsolationForestScore(500.0, recentValues);
        assertTrue(extremeScore >= 0.0 && extremeScore <= 1.0, "Should return normalized score for extreme value");
        assertTrue(extremeScore > normalScore, "Extreme value should score higher than normal value");
    }

    @Test
    @DisplayName("Combined anomaly score normalizes output correctly")
    void testComputeAnomalyScoreNormalization() {
        double[] recentValues = new double[50];
        for (int i = 0; i < 50; i++) {
            recentValues[i] = 100.0 + (Math.random() - 0.5) * 10.0;
        }

        // Normal consumption should produce low score
        double normalConsumption = 100.0;
        double normalScore = anomalyDetectionService.computeAnomalyScore(
                normalConsumption, 100.0, 5.0, 95.0, 105.0, recentValues);
        
        // Extreme consumption should produce high score
        double extremeConsumption = 500.0;
        double extremeScore = anomalyDetectionService.computeAnomalyScore(
                extremeConsumption, 100.0, 5.0, 95.0, 105.0, recentValues);

        assertTrue(extremeScore > normalScore, "Extreme consumption should score higher than normal");
        assertTrue(normalScore >= 0.0 && normalScore <= 1.0, "Normal score should be normalized");
        assertTrue(extremeScore >= 0.0 && extremeScore <= 1.0, "Extreme score should be normalized");
    }
}
