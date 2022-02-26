package org.globalgiving.staffdashboard.rest.exception;

import lombok.Builder;
import lombok.Getter;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;

/** Rest API exception handler. */
@RestControllerAdvice
public class RestApiExceptionHandler extends ResponseEntityExceptionHandler {

  private static final Logger log =
      LoggerFactory.getLogger(RestApiExceptionHandler.class.getName());

  @Value("${org.globalgiving.jwt.loginPage}")
  private String loginUrl_;

  /**
   * Handles authentication exceptions.
   *
   * @param ex the exception occurred
   * @return the error details
   */
  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ApiError> handleAuthenticationException(AuthenticationException ex) {
    log.error("Exception caught: " + ExceptionUtils.getStackTrace(ex));

    ApiError error =
        ApiError.builder()
            .status(HttpStatus.UNAUTHORIZED)
            .details(ex.getMessage())
            .loginUrl(loginUrl_)
            .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
  }

  /**
   * Handles all (catch-all) exceptions.
   *
   * @param ex the exception occurred
   * @return the error details
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleException(Exception ex) {
    log.error("Exception caught: " + ExceptionUtils.getStackTrace(ex));

    ApiError error =
        ApiError.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .details(ex.getMessage())
            .build();

    return ResponseEntity.internalServerError().body(error);
  }

  /** {@inheritDoc} */
  @Override
  protected ResponseEntity<Object> handleExceptionInternal(
      Exception ex, Object body, HttpHeaders headers, HttpStatus status, WebRequest request) {

    log.error("Exception caught: " + ExceptionUtils.getStackTrace(ex));

    ApiError error = ApiError.builder().status(status).details(ex.getMessage()).build();

    return super.handleExceptionInternal(ex, error, headers, status, request);
  }

  /** The error message POJO. */
  @Getter
  @Builder
  private static class ApiError {

    private static final String GENERIC_ERROR_MESSAGE = "An error occurred!";

    private HttpStatus status;
    private String message;
    private String details;
    private String loginUrl;

    /**
     * Returns the error code.
     *
     * @return the error code
     */
    public int getErrorCode() {
      return status.value();
    }

    /**
     * Returns the error message.
     *
     * @return the error message
     */
    public String getMessage() {
      return StringUtils.defaultString(message, GENERIC_ERROR_MESSAGE);
    }

    /**
     * Returns the timestamp.
     *
     * @return the timestamp
     */
    public String getTimestamp() {
      return LocalDateTime.now().toString();
    }
  }
}
