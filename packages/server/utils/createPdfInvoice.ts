import { getAppsembleMessages, getSupportedLanguages, readAsset } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { Decimal } from 'decimal.js';
import tags from 'language-tags';
import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from 'pdf-lib';

import { type Invoice } from '../models/main/Invoice.js';

async function generateHeader(
  page: PDFPage,
  doc: PDFDocument,
  font: PDFFont,
  invoiceTranslations: Record<string, string>,
): Promise<void> {
  const logo = await readAsset('appsemble.png');
  const image = await doc.embedPng(logo);
  page.drawImage(image, {
    x: 50,
    y: 720,
    width: 50,
    height: 50,
  });

  page.drawText(invoiceTranslations.invoice, {
    x: 110,
    y: 740,
    size: 20,
    color: rgb(0.267, 0.267, 0.267),
  });
  page.drawText('Appsemble B.V.', {
    x: 550 - font.widthOfTextAtSize('Appsemble B.V.', 10),
    y: 760,
    size: 10,
    color: rgb(0.267, 0.267, 0.267),
  });
  page.drawText('Klokgebouw 272', {
    x: 550 - font.widthOfTextAtSize('Klokgebouw 272', 10),
    y: 745,
    size: 10,
    color: rgb(0.267, 0.267, 0.267),
  });
  page.drawText('5617 AC Eindhoven', {
    x: 550 - font.widthOfTextAtSize('5617 AC Eindhoven', 10),
    y: 730,
    size: 10,
    color: rgb(0.267, 0.267, 0.267),
  });
  page.drawText('www.appsemble.com', {
    x: 550 - font.widthOfTextAtSize('www.appsemble.com', 10),
    y: 715,
    size: 10,
    color: rgb(0.267, 0.267, 0.267),
  });
}

function generateHr(page: PDFPage, y: number): void {
  page.drawLine({
    start: { x: 50, y },
    end: { x: 550, y },
    color: rgb(0.666, 0.666, 0.666),
    thickness: 1,
  });
}

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function generateTableRow(
  page: PDFPage,
  font: PDFFont,
  y: number,
  description: string,
  unitCost: string,
  btw: string,
  lineTotal: string,
): void {
  page.drawText(description, { x: 50, y, size: 10, font });
  page.drawText(unitCost, { x: 450 - font.widthOfTextAtSize(unitCost, 10), y, size: 10, font });
  page.drawText(btw, { x: 500 - font.widthOfTextAtSize(btw, 10), y, size: 10, font });
  page.drawText(lineTotal, { x: 550 - font.widthOfTextAtSize(lineTotal, 10), y, size: 10, font });
}

function generateCustomerInformation(
  page: PDFPage,
  boldFont: PDFFont,
  invoice: Invoice,
  invoiceTranslations: Record<string, string>,
  baseLang: string,
): void {
  page.drawText(invoiceTranslations.invoice, {
    x: 50,
    y: 640,
    size: 20,
    color: rgb(0.267, 0.267, 0.267),
  });
  generateHr(page, 615);

  const displayNames = new Intl.DisplayNames(baseLang, { type: 'region' });
  const countryName = displayNames.of(invoice.customerCountryCode);

  const customerInformationTop = 600;

  page.drawText(`${invoiceTranslations.invoiceNumber}: `, {
    x: 50,
    y: customerInformationTop,
    size: 10,
  });
  page.drawText(`${invoice.invoiceNumberPrefix}${invoice.id}`, {
    x: 150,
    y: customerInformationTop,
    size: 10,
    font: boldFont,
  });
  page.drawText(`${invoiceTranslations.invoiceDate}: `, {
    x: 50,
    y: customerInformationTop - 15,
    size: 10,
  });
  page.drawText(formatDate(new Date()), {
    x: 150,
    y: customerInformationTop - 15,
    size: 10,
  });
  page.drawText(`${invoiceTranslations.invoiceTotal}: `, {
    x: 50,
    y: customerInformationTop - 30,
    size: 10,
  });
  page.drawText(
    formatCurrency(
      new Decimal(invoice.amount)
        .plus(new Decimal(invoice.amount).times(new Decimal(invoice.vatPercentage).dividedBy(100)))
        .toDecimalPlaces(2)
        .toNumber(),
    ),
    {
      x: 150,
      y: customerInformationTop - 30,
      size: 10,
    },
  );
  page.drawText(invoice.customerName, {
    x: 300,
    y: customerInformationTop,
    size: 10,
    font: boldFont,
  });

  page.drawText(invoice.customerStreetName, {
    x: 300,
    y: customerInformationTop - 15,
    size: 10,
  });
  page.drawText(`${invoice.customerZipCode} ${invoice.customerCity}`, {
    x: 300,
    y: customerInformationTop - 30,
    size: 10,
  });
  page.drawText(countryName!, {
    x: 300,
    y: customerInformationTop - 45,
    size: 10,
  });
  if (invoice.reference) {
    page.drawText(`${invoiceTranslations.reference}: ${invoice.reference}`, {
      x: 300,
      y: customerInformationTop - 60,
      size: 10,
    });
    generateHr(page, customerInformationTop - 75);
  } else {
    generateHr(page, customerInformationTop - 60);
  }
}

function generateInvoiceTable(
  page: PDFPage,
  boldFont: PDFFont,
  font: PDFFont,
  invoice: Invoice,
  invoiceTranslations: Record<string, string>,
): void {
  const invoiceTableTop = 470;

  generateTableRow(
    page,
    boldFont,
    invoiceTableTop,
    invoiceTranslations.description,
    invoiceTranslations.unitCost,
    invoiceTranslations.vat,
    invoiceTranslations.lineTotal,
  );
  generateHr(page, invoiceTableTop - 20);

  const position = invoiceTableTop - 30;
  generateTableRow(
    page,
    font,
    position,
    invoice.subscriptionPlan,
    formatCurrency(new Decimal(invoice.amount).toDecimalPlaces(2).toNumber()),
    formatCurrency(
      new Decimal(invoice.amount)
        .times(new Decimal(invoice.vatPercentage).dividedBy(100))
        .toDecimalPlaces(2)
        .toNumber(),
    ),
    formatCurrency(
      new Decimal(invoice.amount)
        .plus(new Decimal(invoice.amount).times(new Decimal(invoice.vatPercentage).dividedBy(100)))
        .toDecimalPlaces(2)
        .toNumber(),
    ),
  );

  generateHr(page, position - 15);

  generateTableRow(
    page,
    boldFont,
    invoiceTableTop - 55,
    '',
    invoiceTranslations.invoiceTotal,
    '',
    formatCurrency(
      new Decimal(invoice.amount)
        .plus(new Decimal(invoice.amount).times(new Decimal(invoice.vatPercentage).dividedBy(100)))
        .toDecimalPlaces(2)
        .toNumber(),
    ),
  );
}

function generateFooter(
  page: PDFPage,
  font: PDFFont,
  invoiceTranslations: Record<string, string>,
): void {
  page.drawText('0402932235', {
    x: 550 - font.widthOfTextAtSize('0402932235', 10),
    y: 80,
    color: rgb(0.267, 0.267, 0.267),
    size: 10,
  });
  page.drawText('Btw-nr. NL857224128B01', {
    x: 550 - font.widthOfTextAtSize('Btw-nr. NL857224128B01', 10),
    y: 65,
    color: rgb(0.267, 0.267, 0.267),
    size: 10,
  });
  page.drawText('KvK-Nr. 67915582', {
    x: 550 - font.widthOfTextAtSize('KvK-Nr. 67915582', 10),
    y: 50,
    color: rgb(0.267, 0.267, 0.267),
    size: 10,
  });
  page.drawText('IBAN NL07KNAB0255775490', {
    x: 550 - font.widthOfTextAtSize('IBAN NL07KNAB0255775490', 10),
    y: 35,
    color: rgb(0.267, 0.267, 0.267),
    size: 10,
  });
  page.drawText(invoiceTranslations.invoiceDue, {
    x: (612 - font.widthOfTextAtSize(invoiceTranslations.invoiceDue, 10)) / 2,
    y: 20,
    color: rgb(0.267, 0.267, 0.267),
    size: 10,
  });
}

export async function createInvoice(invoice: Invoice, lang = defaultLocale): Promise<Uint8Array> {
  const supportedLanguages = getSupportedLanguages();
  const baseLanguage = tags(lang)
    .subtags()
    .find((sub) => sub.type() === 'language');
  const baseLang = baseLanguage && String(baseLanguage).toLowerCase();
  let invoiceTranslations;
  if ((await supportedLanguages).has(baseLang!) || (await supportedLanguages).has(lang)) {
    const coreMessages = await getAppsembleMessages(lang, baseLang);
    invoiceTranslations = {
      invoice: coreMessages['server.invoice.invoice'],
      invoiceNumber: coreMessages['server.invoice.invoiceNumber'],
      invoiceDate: coreMessages['server.invoice.invoiceDate'],
      item: coreMessages['server.invoice.item'],
      description: coreMessages['server.invoice.description'],
      unitCost: coreMessages['server.invoice.unitCost'],
      vat: coreMessages['server.invoice.vat'],
      lineTotal: coreMessages['server.invoice.lineTotal'],
      invoiceTotal: coreMessages['server.invoice.invoiceTotal'],
      invoiceDue: coreMessages['server.invoice.invoiceDue'],
      reference: coreMessages['server.invoice.reference'],
    };
  }
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  await generateHeader(page, doc, font, invoiceTranslations!);
  generateCustomerInformation(page, boldFont, invoice, invoiceTranslations!, baseLang!);
  generateInvoiceTable(page, boldFont, font, invoice, invoiceTranslations!);
  generateFooter(page, font, invoiceTranslations!);

  return doc.save();
}
