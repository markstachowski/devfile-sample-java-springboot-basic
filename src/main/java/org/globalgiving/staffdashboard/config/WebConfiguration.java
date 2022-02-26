package org.globalgiving.staffdashboard.config;

import lombok.RequiredArgsConstructor;
import org.globalgiving.staffdashboard.util.DisplayableEnum;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.util.Arrays;

/** Spring web configuration. */
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

  /** {@inheritDoc} */
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/**")
        .addResourceLocations("classpath:/public/")
        .resourceChain(true)
        .addResolver(
            new PathResourceResolver() {
              @Override
              protected Resource getResource(String resourcePath, Resource location)
                  throws IOException {

                Resource requestedResource = location.createRelative(resourcePath);
                return requestedResource.exists() && requestedResource.isReadable()
                    ? requestedResource
                    : new ClassPathResource("/public/index.html");
              }
            });
  }

  /** {@inheritDoc} */
  @Override
  public void addFormatters(FormatterRegistry registry) {
    registry.addConverterFactory(new StringToDisplayableEnumConverterFactory());
  }

  /** Converter factory for displayable enums. */
  private static class StringToDisplayableEnumConverterFactory
      implements ConverterFactory<String, DisplayableEnum> {

    /** {@inheritDoc} */
    @Override
    public <T extends DisplayableEnum> Converter<String, T> getConverter(Class<T> targetType) {
      return new StringToDisplayableEnumConverter<T>(targetType);
    }

    /**
     * Converter for displayable enums.
     *
     * @param <T> displayable enum type
     */
    @RequiredArgsConstructor
    private static class StringToDisplayableEnumConverter<T extends DisplayableEnum>
        implements Converter<String, T> {

      private final Class<T> enumType;

      /** {@inheritDoc} */
      @Override
      public T convert(String source) {
        return Arrays.stream(enumType.getEnumConstants())
            .filter(e -> e.getKey().equals(source))
            .findAny()
            .orElse(null);
      }
    }
  }
}
