package org.globalgiving.staffdashboard.rest;

import datadog.trace.api.Trace;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.globalgiving.domain.CorporatePartnerInvoice;
import org.globalgiving.domain.CorporatePartnerLineItem;
import org.globalgiving.domain.CorporatePartnerPurchaseHistory;
import org.globalgiving.domain.UnprocessedGiftCards;
import org.globalgiving.service.GiftService;
import org.globalgiving.service.InvoiceService;
import org.globalgiving.service.LineItemService;
import org.globalgiving.staffdashboard.rest.aggregator.Aggregator;
import org.globalgiving.staffdashboard.rest.aggregator.UnprocessedGiftCardsAggregator.UnprocessedGiftCardsGroupBy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import static org.globalgiving.service.GiftService.UnprocessedGiftCardsFilters.*;

/** The REST endpoint for unprocessed gift cards. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/unprocessed-gift-cards")
public class UnprocessedGiftCardsResource {

  private static final Logger log =
      LoggerFactory.getLogger(UnprocessedGiftCardsResource.class.getName());

  private final GiftService giftService_;
  private final InvoiceService invoiceService_;
  private final LineItemService lineItemService_;
  private final Aggregator<UnprocessedGiftCards> unprocessedGiftCardsAggregator_;

  /**
   * Retrieves a list of unprocessed gift card records based on the given filters.
   *
   * @param startDate the start date
   * @param endDate the end date
   * @param showRedeemed show redeemed records flag (if any)
   * @param showProcessed show processed records flag (if any)
   * @param currency the selected currency (if any)
   * @param groupBy the group by indicator
   * @return the list of unprocessed gift card records
   */
  @GetMapping("/gift-cards")
  @Trace
  public Collection<UnprocessedGiftCards> getGiftCards(
      @RequestParam String startDate,
      @RequestParam String endDate,
      @RequestParam Optional<Boolean> showRedeemed,
      @RequestParam Optional<Boolean> showProcessed,
      @RequestParam Optional<String> currency,
      @RequestParam UnprocessedGiftCardsGroupBy groupBy) {

    log.info("Loading gift cards...");

    Map<String, Object> filters = new HashMap<>();
    filters.put(START_DATE.toString(), startDate);
    filters.put(END_DATE.toString(), endDate);
    filters.put(GROUP_BY.toString(), groupBy);
    showRedeemed.ifPresent(sr -> filters.put(SHOW_REDEEMED.toString(), sr));
    showProcessed.ifPresent(sp -> filters.put(SHOW_PROCESSED.toString(), sp));
    currency.ifPresent(c -> filters.put(CURRENCY.toString(), c));

    log.info("getGiftCards Filters: " + filters);
    List<UnprocessedGiftCards> giftCards = giftService_.getUnprocessedGiftCards(filters);
    Collection<UnprocessedGiftCards> results =
        unprocessedGiftCardsAggregator_.aggregate(giftCards, groupBy);

    log.info("Retrieved {} unprocessed gift cards.", results.size());

    return results;
  }

  /**
   * Retrieves corporate partner invoices for the given list of gift card IDs. Note: Not more than
   * one invoice is supposed to exist!
   *
   * @param giftCardIds the list of gift card IDs
   * @return the corporate partner invoices for the given list of gift card IDs
   */
  @PostMapping("/invoices")
  @Trace
  public List<CorporatePartnerInvoice> getInvoices(@RequestBody List<Integer> giftCardIds) {
    log.info("Loading corporate partner invoices by gift card IDs={}...", giftCardIds);

    List<CorporatePartnerInvoice> invoices =
        invoiceService_.getCorporatePartnerInvoices(giftCardIds);
    log.info("Retrieved {} corporate partner invoices.", invoices.size());
    if (invoices.size() > 1) {
      log.warn("More than one corporate partner invoice found!");
    }

    return invoices;
  }

  /**
   * Retrieves a list of corporate partner purchase history records for the given corporate partner.
   *
   * @param orgId the organization id of the corporate partner
   * @return the list of corporate partner purchase history records
   */
  @GetMapping("/purchase-history")
  @Trace
  public List<CorporatePartnerPurchaseHistory> getPurchaseHistory(@RequestParam Integer orgId) {
    log.info("Loading corporate partner purchase history by org ID={}...", orgId);

    List<CorporatePartnerPurchaseHistory> results =
        giftService_.getCorporatePartnerPurchaseHistory(orgId);
    log.info("Retrieved {} corporate partner purchase history records.", results.size());

    return results;
  }

  /**
   * Retrieves a list of corporate partner line items for the given corporate partner.
   *
   * @param orgId the organization id of the corporate partner
   * @return the list of corporate partner line items
   */
  @GetMapping("/line-items")
  @Trace
  public List<CorporatePartnerLineItem> getLineItems(@RequestParam Integer orgId) {
    log.info("Loading corporate partner line items by org ID={}...", orgId);

    List<CorporatePartnerLineItem> lineItems = new ArrayList<>();
    lineItems.add(lineItemService_.getMiscLineItem());

    List<CorporatePartnerLineItem> corpLineItems =
        lineItemService_.getCorporatePartnerLineItems(orgId);
    lineItems.addAll(corpLineItems);

    log.info("Retrieved {} corporate partner line items.", lineItems.size());

    return lineItems;
  }

  /**
   * Assigns net value for the given cards.
   *
   * @param giftCardsNetValueDto the DTO containing gift card IDs and net value
   */
  @PutMapping
  @Trace
  public void assignNetValue(@RequestBody AssignNetValueDto giftCardsNetValueDto) {
    log.info("Assigning net value for gift cards...");

    Double netValue = giftCardsNetValueDto.getNetValue();
    List<Integer> giftCardIds = giftCardsNetValueDto.getGiftCardIds();

    // TODO: batch update?
    giftService_.assignGiftCardsNetValue(giftCardIds, netValue);

    log.info("Net value={} has been assigned for gift cards IDs={}.", netValue, giftCardIds);
  }

  /** A data transfer object to collect gift card IDs along with net value. */
  @Getter
  @Data
  static class AssignNetValueDto {
    private List<Integer> giftCardIds;
    private Double netValue;
  }
}
