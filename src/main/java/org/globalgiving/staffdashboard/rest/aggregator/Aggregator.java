package org.globalgiving.staffdashboard.rest.aggregator;

import java.util.Collection;
import java.util.List;
import java.util.function.Function;

/**
 * An interface used to group records and get accumulated results.
 *
 * @param <T> the type to which the aggregation is applied
 */
public interface Aggregator<T> {

  /**
   * A collection of aggregated results.
   *
   * @param listToAggregate the list to which the aggregation is applied
   * @param groupBy the group by instance
   * @return the collection of aggregated results
   */
  Collection<T> aggregate(List<T> listToAggregate, GroupBy<T> groupBy);

  /**
   * An interface used to retrieve the classifier of the group by statement. Note: This interface
   * should be implemented by the enum representing the corresponding group by values.
   *
   * @param <T> the type to which the aggregation is applied
   */
  interface GroupBy<T> {

    /**
     * The function representing the composite group by values.
     *
     * @return the function representing the composite group by value
     */
    Function<T, List<Object>> getClassifier();
  }
}
