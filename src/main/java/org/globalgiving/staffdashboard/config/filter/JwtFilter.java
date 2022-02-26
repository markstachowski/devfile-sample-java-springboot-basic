package org.globalgiving.staffdashboard.config.filter;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.globalgiving.domain.UaUser;
import org.globalgiving.service.UaUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedCredentialsNotFoundException;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.Optional;
import java.util.stream.Stream;

/** The JWT Filter checking if authentication cookie exists in the current request. */
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtFilter.class.getName());

  private final UaUserService uaUserService_;
  private final JwtDecoder jwtDecoder_;
  private final GrantedAuthoritiesMapper authoritiesMapper_;
  private final String jwtCookieName_;

  /** {@inheritDoc} */
  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    try {
      Jwt token = jwtDecoder_.decode(retrieveToken(request));

      String userIdStr = token.getSubject();

      UaUser user = uaUserService_.getUser(Integer.parseInt(userIdStr, 10));
      Collection<? extends GrantedAuthority> grants =
          authoritiesMapper_.mapAuthorities(user.getAuthorities());

      PreAuthenticatedAuthenticationToken auth =
          new PreAuthenticatedAuthenticationToken(user, token, grants);

      // ensure we have a fresh clean context
      SecurityContext context = SecurityContextHolder.createEmptyContext();
      context.setAuthentication(auth);
      SecurityContextHolder.setContext(context);
    } catch (Exception ex) {
      log.info("Exception caught: ", ex);
    }
    filterChain.doFilter(request, response);
  }

  /**
   * Retrieves the JWT token.
   *
   * @param request the current request
   * @return the JWT token value
   */
  private String retrieveToken(HttpServletRequest request) {
    Optional<String> jwt = Optional.empty();
    Cookie[] cookies = request.getCookies();

    if (cookies != null) {
      // @formatter:off
      jwt =
          Stream.of(cookies)
              .filter(c -> StringUtils.equals(c.getName(), jwtCookieName_))
              .map(Cookie::getValue)
              .findFirst();
      // @formatter:on
    }

    return jwt.orElseThrow(
        () ->
            new PreAuthenticatedCredentialsNotFoundException(
                "Couldn't find cookie [" + jwtCookieName_ + "] in request"));
  }
}
