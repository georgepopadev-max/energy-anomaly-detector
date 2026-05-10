package com.portafolio.energy.service;

import com.portafolio.energy.dto.AnomalyEventDto;
import com.portafolio.energy.dto.EnergyReadingDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast a new anomaly event to subscribed clients.
     * Clients can subscribe to /topic/anomalies for all anomaly events.
     */
    public void broadcastAnomaly(AnomalyEventDto anomaly) {
        log.debug("Broadcasting anomaly: {} from source {}", anomaly.getId(), anomaly.getSourceName());
        messagingTemplate.convertAndSend("/topic/anomalies", anomaly);
    }

    /**
     * Broadcast a grid status update to subscribed clients.
     * Clients can subscribe to /topic/grid/status for grid health updates.
     */
    public void broadcastGridStatus(Object status) {
        messagingTemplate.convertAndSend("/topic/grid/status", status);
    }

    /**
     * Broadcast a new energy reading for real-time updates.
     * Clients can subscribe to /topic/readings for live reading data.
     */
    public void broadcastReading(EnergyReadingDto reading) {
        messagingTemplate.convertAndSend("/topic/readings", reading);
    }
}