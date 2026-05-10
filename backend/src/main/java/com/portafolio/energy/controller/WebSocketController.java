package com.portafolio.energy.controller;

import com.portafolio.energy.dto.AnomalyEventDto;
import com.portafolio.energy.dto.DashboardStatsDto;
import com.portafolio.energy.service.AnomalyService;
import com.portafolio.energy.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * WebSocket controller for real-time subscriptions.
 * Clients connect via STOMP over SockJS at /ws endpoint.
 * 
 * Subscription topics:
 * - /topic/anomalies - All anomaly events
 * - /topic/grid/status - Grid health updates
 * - /topic/readings - Live energy readings
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final AnomalyService anomalyService;
    private final WebSocketService webSocketService;

    /**
     * Subscribe to grid status updates for a specific grid/region.
     */
    @MessageMapping("/grid/subscribe")
    @SendTo("/topic/grid/status")
    public DashboardStatsDto subscribeToGrid() {
        log.info("Client subscribed to grid");
        return anomalyService.getDashboardStats();
    }

    /**
     * Subscribe to anomaly events, optionally filtered by source.
     */
    @MessageMapping("/anomaly/subscribe")
    @SendTo("/topic/anomalies")
    public AnomalyEventDto subscribeToAnomalies() {
        log.info("Client subscribed to all anomalies");
        // Send the most recent anomalies to the newly subscribed client
        java.util.List<AnomalyEventDto> anomalies = anomalyService.getActiveAnomalies();
        if (!anomalies.isEmpty()) {
            return anomalies.get(0);
        }
        return null;
    }

    /**
     * Request grid status on demand via WebSocket.
     */
    @MessageMapping("/grid/status/request")
    @SendTo("/topic/grid/status")
    public DashboardStatsDto requestGridStatus() {
        return anomalyService.getDashboardStats();
    }
}