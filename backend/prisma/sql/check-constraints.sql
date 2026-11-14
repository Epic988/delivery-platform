ALTER TABLE "ProofOfDelivery"
  ADD CONSTRAINT "proof_type_matches_ref" CHECK (
    ("orderType" = 'SHOPPING' AND "shoppingOrderId" IS NOT NULL AND "courierOrderId" IS NULL) OR
    ("orderType" = 'COURIER'  AND "courierOrderId"  IS NOT NULL AND "shoppingOrderId" IS NULL)
  );

ALTER TABLE "Assignment"
  ADD CONSTRAINT "assignment_type_matches_ref" CHECK (
    ("orderType" = 'SHOPPING' AND "shoppingOrderId" IS NOT NULL AND "courierOrderId" IS NULL) OR
    ("orderType" = 'COURIER'  AND "courierOrderId"  IS NOT NULL AND "shoppingOrderId" IS NULL)
  );

ALTER TABLE "DeliveryEvent"
  ADD CONSTRAINT "event_type_matches_ref" CHECK (
    ("orderType" = 'SHOPPING' AND "shoppingOrderId" IS NOT NULL AND "courierOrderId" IS NULL) OR
    ("orderType" = 'COURIER'  AND "courierOrderId"  IS NOT NULL AND "shoppingOrderId" IS NULL)
  );

ALTER TABLE "CashPayment"
  ADD CONSTRAINT "payment_type_matches_ref" CHECK (
    ("orderType" = 'SHOPPING' AND "shoppingOrderId" IS NOT NULL AND "courierOrderId" IS NULL) OR
    ("orderType" = 'COURIER'  AND "courierOrderId"  IS NOT NULL AND "shoppingOrderId" IS NULL)
  );

ALTER TABLE "Address"
  ADD CONSTRAINT "address_text_not_empty" CHECK (length(trim("addressText")) > 0);

ALTER TABLE "CourierOrder"
  ADD CONSTRAINT "courier_pickup_text_not_empty"      CHECK (length(trim("pickupAddressText")) > 0),
  ADD CONSTRAINT "courier_destination_text_not_empty" CHECK (length(trim("destinationAddressText")) > 0);
