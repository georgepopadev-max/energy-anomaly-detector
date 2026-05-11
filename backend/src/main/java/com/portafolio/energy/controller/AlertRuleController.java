package com.portafolio.energy.controller;

import com.portafolio.energy.model.AlertRule;
import com.portafolio.energy.repository.AlertRuleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alert-rules")
public class AlertRuleController {

    private final AlertRuleRepository alertRuleRepository;

    public AlertRuleController(AlertRuleRepository alertRuleRepository) {
        this.alertRuleRepository = alertRuleRepository;
    }

    @GetMapping
    public List<AlertRule> getAllAlertRules() {
        return alertRuleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertRule> getAlertRuleById(@PathVariable UUID id) {
        return alertRuleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/enabled")
    public List<AlertRule> getEnabledAlertRules() {
        return alertRuleRepository.findByEnabledTrue();
    }

    @PostMapping
    public AlertRule createAlertRule(@RequestBody AlertRule alertRule) {
        return alertRuleRepository.save(alertRule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlertRule> updateAlertRule(@PathVariable UUID id, @RequestBody AlertRule details) {
        return alertRuleRepository.findById(id).map(rule -> {
            rule.setName(details.getName());
            rule.setDescription(details.getDescription());
            rule.setMetricType(details.getMetricType());
            rule.setThresholdMin(details.getThresholdMin());
            rule.setThresholdMax(details.getThresholdMax());
            rule.setSeverity(details.getSeverity());
            rule.setEnabled(details.getEnabled());
            return ResponseEntity.ok(alertRuleRepository.save(rule));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlertRule(@PathVariable UUID id) {
        alertRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}