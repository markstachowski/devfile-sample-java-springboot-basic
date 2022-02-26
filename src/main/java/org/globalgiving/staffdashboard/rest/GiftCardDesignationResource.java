package org.globalgiving.staffdashboard.rest;

import datadog.trace.api.Trace;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.globalgiving.domain.AssignableGiftCard;
import org.globalgiving.domain.Designation;
import org.globalgiving.service.GiftService;
import org.globalgiving.service.VolumeBucketService;
import org.globalgiving.staffdashboard.util.DisplayableEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import static org.globalgiving.service.GiftService.AssignableGiftCardsFilters.*;
import static org.globalgiving.service.GiftService.UnassignedDesignationFilters.*;

/** The REST endpoint for gift card designations. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/gift-card-designations")
public class GiftCardDesignationResource {

  private static final Logger log =
      LoggerFactory.getLogger(GiftCardDesignationResource.class.getName());

  private static final Map<DisplayableEnum, String> INCLUDE_NEGATIVE_VALUE_MAP =
      DisplayableEnum.convertToMap(IncludeNegativeValue.class);

  private final GiftService giftService_;
  private final VolumeBucketService volumeBucketService_;

  /**
   * Retrieves a list of unassigned gift card purchase designations.
   *
   * @param startDate the start date
   * @param endDate the end date
   * @param includeNegativeValue include negative values flag
   * @param currency the selected currency (if any)
   * @param volumeBucket the selected volume bucket (if any)
   * @param unassignedOnly the unassigned records only flag
   * @return the list of designations
   */
  @GetMapping
  @Trace
  public List<Designation> getDesignations(
      @RequestParam String startDate,
      @RequestParam String endDate,
      @RequestParam IncludeNegativeValue includeNegativeValue,
      @RequestParam Optional<String> currency,
      @RequestParam Optional<Integer> volumeBucket,
      @RequestParam(defaultValue = "true") boolean unassignedOnly) {

    log.info("Loading gift card designations...");

    Map<String, Object> filters = new HashMap<>();
    filters.put(START_DATE.toString(), startDate);
    filters.put(END_DATE.toString(), endDate);
    filters.put(UNASSIGNED_ONLY.toString(), unassignedOnly);
    currency.ifPresent(c -> filters.put(CURRENCY.toString(), c));
    volumeBucket.ifPresent(vb -> filters.put(VOLUME_BUCKET.toString(), vb));
    Optional.of(includeNegativeValue)
        .filter(inv -> inv != IncludeNegativeValue.YES)
        .ifPresent(
            inv ->
                filters.put(
                    NEGATIVE_VALUE.toString(), inv == IncludeNegativeValue.ONLY_NEGATIVE_VALUE));

    log.info("getDesignations Filters: " + filters);
    List<Designation> designations =
        giftService_.getUnassignedGiftCardPurchaseDesignations(filters);

    log.info("Retrieved {} gift card designations.", designations.size());

    return designations;
  }

  /**
   * Retrieves a list of assignable gift card records depending on the given filters.
   *
   * @param assignableGiftCardsDto the optional DTO containing assignable gift cards query options
   * @return the list of assignable gift card records
   */
  @PostMapping("/assignable-gift-cards")
  @Trace
  public List<AssignableGiftCard> getAssignableGiftCards(
      @RequestBody AssignableGiftCardsDto assignableGiftCardsDto) {
    log.info("Loading assignable gift cards...");

    List<AssignableGiftCard> assignableGiftCards;
    if (Objects.nonNull(assignableGiftCardsDto.getDesignationId())) {
      Integer designationId = assignableGiftCardsDto.getDesignationId();

      log.info("Loading assignable gift cards using Auto for designation ID={}...", designationId);
      assignableGiftCards = giftService_.getAssignableGiftCardsAuto(designationId);
    } else {
      Map<String, Object> filters = new HashMap<>();

      if (Objects.nonNull(assignableGiftCardsDto.getGiftCardIds())) {
        filters.put(GIFT_CARD_IDS.toString(), assignableGiftCardsDto.getGiftCardIds());
      } else if (StringUtils.isNotBlank(assignableGiftCardsDto.getInvoiceNumber())) {
        filters.put(INVOICE_NUMBER.toString(), assignableGiftCardsDto.getInvoiceNumber());
      } else if (StringUtils.isNotBlank(assignableGiftCardsDto.getPaymentRef())) {
        filters.put(PAYMENT_REF.toString(), assignableGiftCardsDto.getPaymentRef());
      } else {
        throw new IllegalArgumentException(
            "Filter parameter (giftCardIds|paymentRef|invoiceNumber) is required!");
      }

      log.info("getAssignableGiftCards Filters: " + filters);
      assignableGiftCards = giftService_.getAssignableGiftCards(filters);
    }

    log.info("Retrieved {} assignable gift cards.", assignableGiftCards.size());

    return assignableGiftCards;
  }

  /**
   * Retrieves include negative values reference data.
   *
   * @return a map of include negative values enum
   */
  @GetMapping("/include-negative-values")
  @Trace
  public Map<DisplayableEnum, String> getIncludeNegativeValues() {
    return INCLUDE_NEGATIVE_VALUE_MAP;
  }

  /**
   * Retrieves volume bucket reference data.
   *
   * @return the list of volume buckets
   */
  @GetMapping("/volume-buckets")
  @SuppressWarnings("rawtypes")
  @Trace
  public List getVolumeBuckets() {
    return volumeBucketService_.getAllVolumeBuckets();
  }

  /**
   * Assigns gift card purchase designations.
   *
   * @param designationId the designation id
   * @param giftCardIds the list of gift card IDs
   */
  @PutMapping
  @Trace
  public void updateDesignations(
      @RequestParam Integer designationId, @RequestBody List<Integer> giftCardIds) {

    log.info("Updating gift card designations...");

    // TODO: batch update?
    giftService_.assignGiftCardPurchaseDesignation(designationId, giftCardIds);

    log.info(
        "Gift cards IDs={} has been assigned to designation ID={}.", giftCardIds, designationId);
  }

  /** An enum representing include negative value drop-down values. */
  @Getter
  @RequiredArgsConstructor
  enum IncludeNegativeValue implements DisplayableEnum {
    YES("Yes"),
    NO("No"),
    ONLY_NEGATIVE_VALUE("Only negative value");

    private final String key;
  }

  /** A data transfer object to assignable gift card filter values. */
  @Getter
  @Data
  static class AssignableGiftCardsDto {
    private String paymentRef;
    private String invoiceNumber;
    private Integer designationId;
    private List<Integer> giftCardIds;
  }
}
