const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log("Starting peripheral assets migration to parent invoices...");

  try {
    // 1. Fetch all existing PeripheralAsset records
    const assets = await prisma.peripheralAsset.findMany();
    console.log(`Found ${assets.length} existing peripheral assets.`);

    // 2. Group assets by invoiceRef
    const grouped = {};
    const unlinkedAssets = [];

    assets.forEach(asset => {
      // If the asset is already linked to an invoice, skip it
      if (asset.peripheralInvoiceId) {
        return;
      }

      const ref = asset.invoiceRef ? asset.invoiceRef.trim() : "";
      if (!ref) {
        unlinkedAssets.push(asset);
      } else {
        if (!grouped[ref]) {
          grouped[ref] = [];
        }
        grouped[ref].push(asset);
      }
    });

    console.log(`Grouping results:`);
    console.log(`- Unique invoiceRefs to process: ${Object.keys(grouped).length}`);
    console.log(`- Assets without invoiceRef: ${unlinkedAssets.length}`);

    // 3. Process grouped assets (same invoiceRef)
    for (const [invoiceRef, items] of Object.entries(grouped)) {
      console.log(`Processing invoice: ${invoiceRef} with ${items.length} items...`);

      // Find if invoice already exists
      let invoice = await prisma.peripheralInvoice.findUnique({
        where: { invoiceRef }
      });

      if (!invoice) {
        // Find suitable defaults from the first item
        const firstItem = items[0];
        const supplier = firstItem.supplier || "Legacy Supplier";
        const purchaseDate = firstItem.purchaseDate || new Date();
        const poRef = firstItem.poRef || null;
        const companyMasterId = firstItem.companyMasterId || null;
        const totalItemsCost = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

        invoice = await prisma.peripheralInvoice.create({
          data: {
            invoiceRef,
            poRef,
            supplier,
            purchaseDate: new Date(purchaseDate),
            serviceCost: 0,
            deliveryCost: 0,
            taxCost: 0,
            totalCost: totalItemsCost,
            notes: "Migrated from legacy database",
            companyMasterId
          }
        });
        console.log(`Created new invoice ${invoiceRef} (ID: ${invoice.id})`);
      }

      // Link items to this invoice
      const itemIds = items.map(item => item.id);
      await prisma.peripheralAsset.updateMany({
        where: { id: { in: itemIds } },
        data: { peripheralInvoiceId: invoice.id }
      });
      console.log(`Linked ${items.length} items to invoice ${invoiceRef}`);
    }

    // 4. Process assets without invoiceRef (each gets its own dummy/legacy invoice)
    for (const asset of unlinkedAssets) {
      const legacyRef = `LEGACY-INV-${asset.id.slice(0, 8)}`;
      console.log(`Processing asset ${asset.name} without invoiceRef. Creating legacy invoice ${legacyRef}...`);

      const invoice = await prisma.peripheralInvoice.create({
        data: {
          invoiceRef: legacyRef,
          poRef: asset.poRef || null,
          supplier: asset.supplier || "Legacy Supplier",
          purchaseDate: asset.purchaseDate || new Date(),
          serviceCost: 0,
          deliveryCost: 0,
          taxCost: 0,
          totalCost: asset.totalCost || 0,
          notes: "Migrated from legacy database (no invoice reference)",
          companyMasterId: asset.companyMasterId || null
        }
      });

      await prisma.peripheralAsset.update({
        where: { id: asset.id },
        data: { peripheralInvoiceId: invoice.id }
      });
      console.log(`Linked asset ${asset.name} to invoice ${legacyRef}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
