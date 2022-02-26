package org.globalgiving.staffdashboard.rest;

import datadog.trace.api.Trace;
import lombok.RequiredArgsConstructor;
import org.globalgiving.domain.*;
import org.globalgiving.service.GiftService;
import org.globalgiving.service.GiftService.SuspenseAccountTransferFilters;
import org.globalgiving.service.InvoiceService;
import org.globalgiving.service.SuspenseAccountService;
import org.globalgiving.staffdashboard.rest.aggregator.Aggregator;
import org.globalgiving.staffdashboard.rest.aggregator.UnassignedGiftCardsAggregator.UnassignedGiftCardsGroupBy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.globalgiving.service.GiftService.UnassignedGiftCardsFilters.*;

/** The REST endpoint for gift card assignments. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/gift-card-assignments")
public class GiftCardAssignmentResource {

  private static final Logger log =
      LoggerFactory.getLogger(GiftCardAssignmentResource.class.getName());

  private final GiftService giftService_;
  private final SuspenseAccountService suspenseAccountService_;
  private final InvoiceService invoiceService_;
  private final Aggregator<UnassignedGiftCards> unassignedGiftCardsAggregator_;

  /**
   * Retrieves a list of unassigned gift card records based on the given filters.
   *
   * @param startDate the start date
   * @param endDate the end date
   * @param showVoided show voided records flag
   * @param invoiceStatus the selected invoice status (if any)
   * @param groupBy the group by indicator
   * @return the list of unassigned gift card records
   */
  @GetMapping("/gift-cards")
  @Trace
  public Collection<UnassignedGiftCards> getGiftCards(
      @RequestParam String startDate,
      @RequestParam String endDate,
      @RequestParam(defaultValue = "false") boolean showVoided,
      @RequestParam Optional<Invoice.Stage> invoiceStatus,
      @RequestParam UnassignedGiftCardsGroupBy groupBy) {

    log.info("Loading gift cards...");

    Map<String, Object> filters = new HashMap<>();
    filters.put(START_DATE.toString(), startDate);
    filters.put(END_DATE.toString(), endDate);
    filters.put(GROUP_BY.toString(), groupBy);
    filters.put(SHOW_VOIDED.toString(), showVoided);
    invoiceStatus.ifPresent(is -> filters.put(INVOICE_STATUS.toString(), is));

    log.info("getGiftCards Filters: " + filters);
    List<UnassignedGiftCards> giftCards = giftService_.getUnassignedGiftCards(filters);
    Collection<UnassignedGiftCards> results =
        unassignedGiftCardsAggregator_.aggregate(giftCards, groupBy);

    log.info("Retrieved {} unassigned gift cards.", results.size());

    return results;
  }

  /**
   * Retrieves a list of suspense account records for the given organizations.
   *
   * @param orgIds the list of organization IDs
   * @return the list of suspense account records
   */
  @PostMapping("/suspense-accounts")
  @Trace
  public List<SuspenseAccount> getSuspenseAccounts(@RequestBody List<Integer> orgIds) {
    log.info("Loading suspense accounts by org IDs={}...", orgIds);

    List<SuspenseAccount> suspenseAccounts =
        suspenseAccountService_.getSuspenseAccountsForOrgIds(orgIds);
    log.info("Retrieved {} suspense accounts.", suspenseAccounts.size());

    return suspenseAccounts;
  }

  /**
   * Retrieves a list of suspense account transfer records based on the given filters.
   *
   * @param startDate the start date
   * @param endDate the end date
   * @param projectId the project id
   * @return the list of suspense account transfer records
   */
  @GetMapping("/suspense-account-transfers")
  @Trace
  public List<SuspenseAccountTransfer> getSuspenseAccountTransfers(
      @RequestParam String startDate,
      @RequestParam String endDate,
      @RequestParam Integer projectId) {

    log.info("Loading suspense account transfers...");

    Map<String, Object> filters = new HashMap<>();
    filters.put(SuspenseAccountTransferFilters.START_DATE.toString(), startDate);
    filters.put(SuspenseAccountTransferFilters.END_DATE.toString(), endDate);
    filters.put(SuspenseAccountTransferFilters.PROJECT_ID.toString(), projectId);

    log.info("getSuspenseAccountTransfers Filters: " + filters);
    List<SuspenseAccountTransfer> transfers = giftService_.getSuspenseAccountTransfers(filters);

    log.info("Retrieved {} suspense account transfers.", transfers.size());

    return transfers;
  }

  /**
   * Retrieves a list of invoice item history records for the given organizations.
   *
   * @param orgIds the list of organization IDs
   * @return the list of invoice item history records
   */
  @PostMapping("/invoice-items")
  @Trace
  public List<InvoiceItemHistory> getInvoiceItems(@RequestBody List<Integer> orgIds) {
    log.info("Loading invoice items by org IDs={}...", orgIds);

    List<InvoiceItemHistory> invoiceItems =
        invoiceService_.getCorporatePartnerInvoiceItemHistory(orgIds);
    log.info("Retrieved {} invoice items.", invoiceItems.size());

    return invoiceItems;
  }

  /**
   * Retrieves invoice statuses {@link Invoice.Stage}.
   *
   * @return a map of invoice status enums and their values
   */
  @GetMapping("/invoice-statuses")
  @Trace
  public Map<Invoice.Stage, String> getInvoiceStatuses() {
    return Arrays.stream(Invoice.Stage.values())
        .collect(Collectors.toMap(Function.identity(), Invoice.Stage::getStringValue));
  }

  /**
   * Assigns given gift cards as giveaway.
   *
   * @param giftCardIds the list of gift card IDs
   */
  @PutMapping
  @Trace
  public void assignAsGiveaway(@RequestBody List<Integer> giftCardIds) {
    log.info("Assigning gift cards as give away...");

    // TODO: batch update?
    giftService_.assignGiftCardsAsGiveaway(giftCardIds);

    log.info("Gift cards IDs={} has been assigned as giveaway.", giftCardIds);
  }
}
