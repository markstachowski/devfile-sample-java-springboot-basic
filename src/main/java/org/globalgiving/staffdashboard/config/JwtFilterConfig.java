package org.globalgiving.staffdashboard.config;

import org.apache.commons.codec.binary.Base64;
import org.globalgiving.service.UaUserService;
import org.globalgiving.staffdashboard.config.filter.JwtFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;

/** JWT Filter configuration. */
@Configuration
public class JwtFilterConfig {

  /**
   * Creates a new instance of {@link JwtFilter}.
   *
   * @param publicKeyStr the public key of the JWT token
   * @param cookieName the name of the authentication cookie
   * @param uaUserService the {@link UaUserService} instance
   * @param authoritiesMapper the {@link GrantedAuthoritiesMapper} instance
   * @return the newly created instance
   * @throws InvalidKeySpecException the exception
   * @throws NoSuchAlgorithmException the exception
   */
  @Bean
  public JwtFilter jwtFilter(
      @Value("${org.globalgiving.jwt.public-key}") String publicKeyStr,
      @Value("${org.globalgiving.jwt.cookieName}") String cookieName,
      UaUserService uaUserService,
      GrantedAuthoritiesMapper authoritiesMapper)
      throws InvalidKeySpecException, NoSuchAlgorithmException {

    publicKeyStr =
        publicKeyStr
            .replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "");

    byte[] publicKeyBytes = Base64.decodeBase64(publicKeyStr);
    RSAPublicKey publicKey =
        (RSAPublicKey)
            KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(publicKeyBytes));
    JwtDecoder jwtDecoder =
        NimbusJwtDecoder.withPublicKey(publicKey)
            .signatureAlgorithm(SignatureAlgorithm.RS512)
            .build();

    return new JwtFilter(uaUserService, jwtDecoder, authoritiesMapper, cookieName);
  }
}
