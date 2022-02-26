package org.globalgiving.staffdashboard.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAccessor;

/** Application utility class. */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class AppUtils {

  public static final DateTimeFormatter DATE_TIME_FORMATTER =
      DateTimeFormatter.ofPattern("MM/dd/yy HH:mm Z");

  /**
   * Formats date using DATE_TIME_FORMATTER pattern.
   *
   * @param temporal the date instance
   * @return the formatted date
   */
  public static String formatDate(TemporalAccessor temporal) {
    return DATE_TIME_FORMATTER.format(temporal);
  }

  /**
   * Retrieves authentication instance from Spring security context.
   *
   * @return the authentication instance
   */
  public static Authentication getAuthentication() {
    return SecurityContextHolder.getContext().getAuthentication();
  }
}
