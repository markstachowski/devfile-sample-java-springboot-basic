package org.globalgiving.staffdashboard.util;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** An interface representing displayable enums */
public interface DisplayableEnum {

  /**
   * Generates a map representation of the given displayable enum.
   *
   * @param clazz the class of the generic type
   * @param <T> the generic type
   * @return the map representation of the given displayable enum
   */
  static <T extends Enum<T> & DisplayableEnum> Map<DisplayableEnum, String> convertToMap(
      Class<T> clazz) {
    return Arrays.stream(clazz.getEnumConstants())
        .collect(Collectors.toMap(Function.identity(), e -> e.getKey()));
  }

  /**
   * Return the key of the displayable enum instance.
   *
   * @return the key
   */
  String getKey();
}
