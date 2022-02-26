package org.globalgiving.staffdashboard.rest.aggregator;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.globalgiving.domain.UnprocessedGiftCards;
import org.globalgiving.staffdashboard.util.DisplayableEnum;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

import static java.lang.Boolean.logicalAnd;
import static java.lang.Double.sum;

/** The aggregator used for unprocessed gift cards. */
@Component
public class UnprocessedGiftCardsAggregator extends AbstractAggregator<UnprocessedGiftCards> {

  /** {@inheritDoc} */
  @Override
  protected void accumulate(UnprocessedGiftCards result, UnprocessedGiftCards next) {
    result.addGiftCardId(next.getGiftCardId());

    result.setGiftCardId(getFieldValue(result.getGiftCardId(), next.getGiftCardId()));
    result.setPurchaseDate(getFieldValue(result.getPurchaseDate(), next.getPurchaseDate()));
    result.setInvoiceStatus(getFieldValue(result.getInvoiceStatus(), next.getInvoiceStatus()));
    result.setPurchaseAmount(getFieldValue(result.getPurchaseAmount(), next.getPurchaseAmount()));
    result.setSettlementAmount(
        getFieldValue(result.getSettlementAmount(), next.getSettlementAmount()));
    result.setAddonRate(getFieldValue(result.getAddonRate(), next.getAddonRate()));
    result.setUnassignedNetValue(
        getFieldValue(result.getUnassignedNetValue(), next.getUnassignedNetValue()));
    result.setLineItem(getFieldValue(result.getLineItem(), next.getLineItem()));
    result.setBuyerReceiptItemId(
        getFieldValue(result.getBuyerReceiptItemId(), next.getBuyerReceiptItemId()));

    result.setPurchaseAmountTotal(
        sum(result.getPurchaseAmountTotal(), next.getPurchaseAmountTotal()));
    result.setSettlementAmountTotal(
        sum(result.getSettlementAmountTotal(), next.getSettlementAmountTotal()));
    result.setRedeemedAmountTotal(
        sum(result.getRedeemedAmountTotal(), next.getRedeemedAmountTotal()));
    result.setRedeemed(logicalAnd(result.isRedeemed(), next.isRedeemed()));
    result.setDesignated(logicalAnd(result.isDesignated(), next.isDesignated()));
  }

  /** {@inheritDoc} */
  @Override
  protected void beforeAggregation(UnprocessedGiftCards initialState) {
    initialState.addGiftCardId(initialState.getGiftCardId());
  }

  /** {@inheritDoc} */
  @Override
  protected void afterAggregation(UnprocessedGiftCards result) {
    result.setGiftCardCount(result.getGiftCardIds().size());
  }

  /** An enum representing all group by options for unprocessed gift cards. */
  @Getter
  @RequiredArgsConstructor
  public enum UnprocessedGiftCardsGroupBy
      implements GroupBy<UnprocessedGiftCards>, DisplayableEnum {
    PARTNER_ID_PAYMENT_REF_IS_PROCESSED_PRESENTMENT_CUR_SETTLEMENT_CUR_INV_ITEM_ID(
        "1",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.isProcessed(),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.getInvoiceItemId())),

    PARTNER_ID_PAYMENT_REF_IS_PROCESSED_PRESENTMENT_CUR_SETTLEMENT_CUR_INV_ITEM_ID_IS_REDEEMED(
        "2",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.isProcessed(),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.getInvoiceItemId(),
                giftCards.isRedeemed())),

    PARTNER_ID_PAYMENT_REF_IS_PROCESSED_PRESENTMENT_CUR_SETTLEMENT_CUR_INV_ITEM_ID_IS_ASSIGNED(
        "3",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.isProcessed(),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.getInvoiceItemId(),
                giftCards.isDesignated())),

    PARTNER_ID_PAYMENT_REF_IS_PROCESSED_PRESENTMENT_CUR_SETTLEMENT_CUR_INV_ITEM_ID_PURCHASE_DATE(
        "4",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.isProcessed(),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.getInvoiceItemId(),
                giftCards.getPurchaseDate()));

    private final String key;
    private final Function<UnprocessedGiftCards, List<Object>> classifier;
  }
}
