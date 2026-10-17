# StockOS — Single-Shop Inventory

StockOS manages products and stock for one small shop (warung).

## Language

**Warung**:
The single shop whose products and stock are managed in StockOS. Separate shops, warehouses, and inter-location stock transfers are outside the current scope.
_Avoid_: Warehouse, tenant, company group

**Pemilik (Owner)**:
The sole account holder who registers and operates the single warung in StockOS. Staff accounts and registration for multiple independent shops are outside the agreed initial scope.
_Avoid_: Customer, supplier

**Satuan stok (Stock unit)**:
The product's unit for counting whole quantities of goods, such as pcs, bottles, or packs. Fractional quantities for weighed goods are outside the agreed initial scope.
_Avoid_: Weight, fractional stock

**Potensi Pendapatan**:
The estimated selling value of all currently available stock at current selling prices, assuming every unit is sold. It is not realized revenue and has no month-to-date sales period.
_Avoid_: Revenue, actual revenue, monthly sales

**Potensi Laba Kotor**:
The estimated selling value of available stock at current selling prices minus its weighted-average purchase cost, before operating expenses. It is not realized profit or net profit.
_Avoid_: Net profit, keuntungan bersih, monthly profit

**Dus/karton**:
A receiving-input convenience whose whole-number count multiplied by units per carton yields stock in the product's base unit. It does not represent a separate stock balance.
_Avoid_: Separate carton inventory

**Arsip produk**:
Deactivation of a product with zero remaining stock while preserving its identity, SKU, and movement history. An archived product can be reactivated; its SKU is not reassigned to a different product.
_Avoid_: Permanent deletion, history deletion

**Stok opname**:
A physical count reconciled against system stock, retained even when no adjustment is needed; it preserves the current average cost unless previously empty stock is found and its cost must be supplied. If stock changes after counting begins, the count must be checked again before reconciliation. Physical discrepancies and quantity-entry corrections are not sold quantity.
_Avoid_: Unconditional stock overwrite

**Koreksi stok**:
A new auditable record correcting an earlier stock entry while preserving the original history. It is not an edit or deletion of a past movement.
_Avoid_: Movement rewrite, history deletion

**Modal rata-rata tertimbang**:
The average purchase cost per stock unit, weighted by the quantities remaining and newly received. Receiving 10 units at Rp3,000 while holding 10 units at Rp4,000 yields an average cost of Rp3,500 per unit.
_Avoid_: Latest purchase price, selling price, FIFO cost

**Referensi nota**:
A receipt identifier attached to a stock receipt for one product; several separately recorded product receipts may share it. It does not imply a purchase order or an all-or-nothing multi-product receipt.
_Avoid_: Purchase order, batch transaction

**Lokasi rak**:
Optional descriptive information identifying where a product sits within the single warung. It is not a separately tracked stock location.
_Avoid_: Warehouse, stock location balance

**Total biaya penerimaan**:
The product's total purchase cost in whole Rupiah for one receipt, including opening stock, without shipping or other-charge allocation. Zero means the goods were genuinely free, not that their cost is unknown.
_Avoid_: Selling value, unknown cost

**Penyesuaian modal**:
A reasoned, auditable change to the purchase-cost value of stock currently held, correcting its present valuation without rewriting past entries. It is not an operating expense or a sales transaction.
_Avoid_: Expense, retrospective ledger rewrite

**Stok masuk (Stock in)**:
Goods added to the warung's stock through a receipt or opening-stock entry, with their total purchase cost recorded. It increases the counted stock and its purchase-cost value.
_Avoid_: Purchase order, sales revenue

**Stok keluar (Stock out)**:
Sold goods manually recorded to reduce stock when no POS integration exists. It records sold quantity, not payment, a sales invoice, or realized revenue.
_Avoid_: Damage/loss transaction, POS sale, payment record
