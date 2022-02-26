package org.globalgiving.staffdashboard.rest.aggregator;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.globalgiving.domain.UnassignedGiftCards;
import org.globalgiving.staffdashboard.util.DisplayableEnum;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

import static java.lang.Boolean.logicalAnd;
import static java.lang.Double.sum;

/** The aggregator used for unassigned gift cards. */
@Component
public class UnassignedGiftCardsAggregator extends AbstractAggregator<UnassignedGiftCards> {

  /** {@inheritDoc} */
  @Override
  protected void accumulate(UnassignedGiftCards result, UnassignedGiftCards next) {
    result.addGiftCardId(next.getGiftCardId());

    result.setGiftCardId(getFieldValue(result.getGiftCardId(), next.getGiftCardId()));
    result.setPurchaseDate(getFieldValue(result.getPurchaseDate(), next.getPurchaseDate()));
    result.setExpireDate(getFieldValue(result.getExpireDate(), next.getExpireDate()));
    result.setInvoiceStatusDate(
        getFieldValue(result.getInvoiceStatusDate(), next.getInvoiceStatusDate()));
    result.setInvoiceNumber(getFieldValue(result.getInvoiceNumber(), next.getInvoiceNumber()));
    result.setInvoiceStatus(getFieldValue(result.getInvoiceStatus(), next.getInvoiceStatus()));
    result.setSuspenseAccountId(
        getFieldValue(result.getSuspenseAccountId(), next.getSuspenseAccountId()));

    result.setPurchaseAmountTotal(
        sum(result.getPurchaseAmountTotal(), next.getPurchaseAmountTotal()));
    result.setSettlementAmountTotal(
        sum(result.getSettlementAmountTotal(), next.getSettlementAmountTotal()));
    result.setRedeemedAmountTotal(
        sum(result.getRedeemedAmountTotal(), next.getRedeemedAmountTotal()));
    result.setSettlementRedeemedAmountTotal(
        sum(result.getSettlementRedeemedAmountTotal(), next.getSettlementRedeemedAmountTotal()));
    result.setSettlementAddonAmountTotal(
        sum(result.getSettlementAddonAmountTotal(), next.getSettlementAddonAmountTotal()));
    result.setSettlementNetAmountTotal(
        sum(result.getSettlementNetAmountTotal(), next.getSettlementNetAmountTotal()));
    result.setRedeemed(logicalAnd(result.isRedeemed(), next.isRedeemed()));
  }

  /** {@inheritDoc} */
  @Override
  protected void beforeAggregation(UnassignedGiftCards initialState) {
    initialState.addGiftCardId(initialState.getGiftCardId());
  }

  /** {@inheritDoc} */
  @Override
  protected void afterAggregation(UnassignedGiftCards result) {
    result.setGiftCardCount(result.getGiftCardIds().size());
  }

  /** An enum representing all group by options for unassigned gift cards. */
  @Getter
  @RequiredArgsConstructor
  public enum UnassignedGiftCardsGroupBy implements GroupBy<UnassignedGiftCards>, DisplayableEnum {
    PARTNER_ID_PAYMENT_REF_PRESENTMENT_CUR_SETTLEMENT_CUR(
        "1",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency())),

    PARTNER_ID_PAYMENT_REF_PRESENTMENT_CUR_SETTLEMENT_CUR_IS_REDEEMED(
        "2",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.isRedeemed())),

    PARTNER_ID_PAYMENT_REF_PRESENTMENT_CUR_SETTLEMENT_CUR_PURCHASE_DATE(
        "3",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.getPurchaseDate())),

    PARTNER_ID_PAYMENT_REF_PRESENTMENT_CUR_SETTLEMENT_CUR_PURCHASE_AMT(
        "4",
        giftCards ->
            Arrays.asList(
                giftCards.getOrganizationId(),
                StringUtils.lowerCase(giftCards.getPaymentRef()),
                giftCards.getPresentmentCurrency(),
                giftCards.getSettlementCurrency(),
                giftCards.getPurchaseAmount())),

    GIFT_CARD_ID("5", giftCards -> Collections.singletonList(giftCards.getGiftCardId()));

    private final String key;
    private final Function<UnassignedGiftCards, List<Object>> classifier;
  }
}
