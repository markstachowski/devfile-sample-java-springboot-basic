package org.globalgiving.staffdashboard.rest;

import datadog.trace.api.Trace;
import lombok.Builder;
import lombok.Getter;
import org.globalgiving.staffdashboard.util.AppUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/** The REST endpoint for user information. */
@RestController
@RequestMapping("/api/user-info")
public class UserInfoResource {

  private static final UserInfo UNAUTHENTICATED_USER_INFO = UserInfo.builder().username("").build();

  /**
   * Retrieves the currently authenticated user information.
   *
   * @return the currently authenticated user information
   */
  @GetMapping
  @Trace
  public UserInfo getUserInfo() {
    Authentication authentication = AppUtils.getAuthentication();

    if (authentication == null) {
      return UNAUTHENTICATED_USER_INFO;
    } else {
      List<String> authorities =
          authentication.getAuthorities().stream()
              .map(GrantedAuthority::getAuthority)
              .collect(Collectors.toList());

      return UserInfo.builder().username(authentication.getName()).authorities(authorities).build();
    }
  }

  /** A POJO containing user information. */
  @Getter
  @Builder
  static class UserInfo {
    private String username;
    private List<String> authorities;
  }
}
