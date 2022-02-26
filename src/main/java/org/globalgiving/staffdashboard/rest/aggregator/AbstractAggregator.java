package org.globalgiving.staffdashboard.rest.aggregator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.List;

import static java.util.stream.Collectors.*;

/**
 * Skeletal implementation of the aggregator interface.
 *
 * @param <T> the type to which the aggregation is applied
 */
public abstract class AbstractAggregator<T> implements Aggregator<T> {

  static final String MULTIPLE_VALUE = "Multiple";
  private static final Logger log = LoggerFactory.getLogger(AbstractAggregator.class.getName());

  /** {@inheritDoc} */
  @Override
  public final Collection<T> aggregate(List<T> listToAggregate, GroupBy<T> groupBy) {
    log.info("Aggregating {} records...", listToAggregate.size());

    return listToAggregate.stream()
        .collect(groupingBy(groupBy.getClassifier(), collectingAndThen(toList(), this::process)))
        .values();
  }

  /**
   * Performs aggregation on the given list.
   *
   * @param listToAggregate the list to aggregate
   * @return the aggregated result
   */
  private T process(List<T> listToAggregate) {
    T result = listToAggregate.remove(0);

    beforeAggregation(result);
    listToAggregate.forEach(next -> accumulate(result, next));
    afterAggregation(result);

    return result;
  }

  /**
   * The accumulator method.
   *
   * @param result the accumulated result
   * @param next the next record to be processed and added to the result
   */
  protected abstract void accumulate(T result, T next);

  /**
   * Hook method that runs before aggregation process is started.
   *
   * @param initialState the initial state
   */
  protected void beforeAggregation(T initialState) {}

  /**
   * Hook method that runs after aggregation process is complete.
   *
   * @param result the aggregated result
   */
  protected void afterAggregation(T result) {}

  /**
   * Returns the previous value if it is equal to the next value. Otherwise, returns 'Multiple'.
   *
   * @param previousValue the previous value
   * @param nextValue the next value
   * @return the previous value if it is equal to the next value, 'Multiple' otherwise
   */
  protected String getFieldValue(String previousValue, String nextValue) {
    return !previousValue.equals(nextValue) ? MULTIPLE_VALUE : previousValue;
  }
}
