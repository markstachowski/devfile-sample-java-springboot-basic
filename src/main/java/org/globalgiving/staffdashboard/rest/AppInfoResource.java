package org.globalgiving.staffdashboard.rest;

import datadog.trace.api.Trace;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.globalgiving.staffdashboard.util.AppUtils;
import org.springframework.boot.info.BuildProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;

/** The REST endpoint for application information. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/build-properties")
public class AppInfoResource {

  private final BuildProperties buildProperties;

  /**
   * Retrieves application build properties.
   *
   * @return the application build properties
   */
  @GetMapping
  @Trace
  public BuildProps getBuildProps() {
    return BuildProps.builder()
        .version(buildProperties.getVersion())
        .time(AppUtils.formatDate(buildProperties.getTime().atZone(ZoneId.systemDefault())))
        .build();
  }

  /** A POJO containing build information. */
  @Getter
  @Builder
  static class BuildProps {
    private String version;
    private String time;
  }
}
