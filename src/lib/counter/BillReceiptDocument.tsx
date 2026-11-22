import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Bill } from './queries'
import { billNoText, cashChange, paymentLabel, rm } from './rules'
import { BILL_ISSUER, receiptLineName } from './issuer'

/**
 * The counter receipt as a PDF — laid out like the Deepavali package receipt
 * (same bands, logo, RECEIPT block, PAID stamp, Billed to, table, payment
 * panel and footer) in the site's own fonts and colours.
 *
 * `assetBase` is where /public is served from: the site's origin in the app,
 * or the public folder's path in tests.
 */

const registered = new Set<string>()
function registerFonts(base: string) {
  if (registered.has(base)) return
  const f = (name: string) => `${base}/fonts/receipt/${name}.ttf`
  Font.register({
    family: 'Montserrat',
    fonts: [
      { src: f('Montserrat-SemiBold'), fontWeight: 600 },
      { src: f('Montserrat-Bold'), fontWeight: 700 },
      { src: f('Montserrat-ExtraBold'), fontWeight: 800 },
    ],
  })
  Font.register({
    family: 'Lora',
    fonts: [
      { src: f('Lora-Regular'), fontWeight: 400 },
      { src: f('Lora-SemiBold'), fontWeight: 600 },
      { src: f('Lora-Italic'), fontWeight: 400, fontStyle: 'italic' },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
  registered.add(base)
}

const C = BILL_ISSUER.colors
const fade = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
const PAID = '#047857'

const s = StyleSheet.create({
  page: { fontFamily: 'Lora', fontSize: 9.5, color: C.dark, paddingBottom: 36 },
  band: { height: 5.5, backgroundColor: C.primary },
  bandGold: { height: 2, backgroundColor: C.accent },
  body: { paddingHorizontal: 38, paddingTop: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  legal: { marginTop: 8, fontSize: 8.6, lineHeight: 1.5, color: fade(C.dark, 0.7) },
  legalName: { fontWeight: 600, color: C.dark },
  receipt: { fontFamily: 'Montserrat', fontWeight: 800, fontSize: 21, letterSpacing: 1.6, color: C.primary, textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2, fontSize: 9 },
  metaKey: { color: fade(C.dark, 0.5), width: 64 },
  metaVal: { fontWeight: 600, minWidth: 70 },
  stamp: {
    marginTop: 9,
    alignSelf: 'flex-end',
    borderWidth: 1.6,
    borderColor: PAID,
    borderRadius: 4,
    color: PAID,
    paddingVertical: 3,
    paddingHorizontal: 9,
    fontFamily: 'Montserrat',
    fontWeight: 800,
    fontSize: 9.5,
    letterSpacing: 2.4,
    transform: 'rotate(-3deg)',
  },
  rule: { marginTop: 18, borderTopWidth: 0.7, borderTopColor: fade(C.dark, 0.12), paddingTop: 14, flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: 7.4, letterSpacing: 1.8, color: C.accent, textTransform: 'uppercase' },
  billedName: { marginTop: 5, fontWeight: 600, fontSize: 10.5 },
  muted: { color: fade(C.dark, 0.7), fontSize: 9.5, lineHeight: 1.5 },
  th: { flexDirection: 'row', backgroundColor: C.primary, marginTop: 20, paddingVertical: 6, paddingHorizontal: 8 },
  thText: { fontFamily: 'Montserrat', fontWeight: 700, fontSize: 7.6, letterSpacing: 1.6, color: '#ffffff', textTransform: 'uppercase' },
  tr: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 0.6, borderBottomColor: fade(C.dark, 0.1) },
  cDesc: { flex: 1 },
  cQty: { width: 70, textAlign: 'center' },
  cAmt: { width: 90, textAlign: 'right' },
  itemName: { fontWeight: 600 },
  itemSub: { marginTop: 1.5, fontSize: 8.6, color: fade(C.dark, 0.65) },
  totRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 8, marginTop: 5 },
  totKey: { width: 110, textAlign: 'right', color: fade(C.dark, 0.6), marginRight: 10 },
  totVal: { width: 90, textAlign: 'right' },
  totalKey: { width: 110, textAlign: 'right', marginRight: 10, fontFamily: 'Montserrat', fontWeight: 700, fontSize: 10.5, color: C.primary },
  totalVal: { width: 90, textAlign: 'right', fontFamily: 'Montserrat', fontWeight: 800, fontSize: 12.5, color: C.primary },
  panel: { marginTop: 20, backgroundColor: fade(C.cream, 1), borderRadius: 8, padding: 14, flexDirection: 'row' },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3.5, fontSize: 9 },
  pKey: { color: fade(C.dark, 0.6) },
  pVal: { fontWeight: 600, textAlign: 'right' },
  footer: { marginTop: 24, paddingTop: 11, borderTopWidth: 0.7, borderTopColor: fade(C.dark, 0.12), textAlign: 'center', fontSize: 8.4, lineHeight: 1.6, color: fade(C.dark, 0.6) },
  thanks: { color: C.primary, fontWeight: 600 },
})

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', ...opts })

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.pRow}>
      <Text style={s.pKey}>{k}</Text>
      <Text style={s.pVal}>{v}</Text>
    </View>
  )
}

export default function BillReceiptDocument({ bill, patientNo, assetBase }: { bill: Bill; patientNo: string | null; assetBase: string }) {
  registerFonts(assetBase)
  const change = bill.paymentMethod === 'cash' && bill.amountReceivedRm != null ? cashChange(bill.totalRm, bill.amountReceivedRm) : null
  const sessions = bill.items.filter((i) => i.kind === 'package')
  const logoW = BILL_ISSUER.logo.withName ? 44 : 128
  const logoH = (logoW * BILL_ISSUER.logo.height) / BILL_ISSUER.logo.width

  return (
    <Document title={`Receipt ${billNoText(bill.billNo)}`} author={BILL_ISSUER.tradingName}>
      <Page size="A4" style={s.page}>
        <View style={s.band} />
        <View style={s.bandGold} />
        <View style={s.body}>
          <View style={s.header}>
            <View style={{ maxWidth: 300 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={`${assetBase}${BILL_ISSUER.logo.src}`} style={{ width: logoW, height: logoH }} />
                {BILL_ISSUER.logo.withName && (
                  <Text style={{ marginLeft: 8, fontFamily: 'Montserrat', fontWeight: 700, fontSize: 14, color: C.primary }}>{BILL_ISSUER.tradingName}</Text>
                )}
              </View>
              <View style={s.legal}>
                <Text style={s.legalName}>{BILL_ISSUER.legalName}</Text>
                <Text>Reg. No: {BILL_ISSUER.regNo}</Text>
                {BILL_ISSUER.addressLines.map((l) => <Text key={l}>{l}</Text>)}
                <Text>{BILL_ISSUER.phones.join(' · ')}</Text>
                <Text>{BILL_ISSUER.email}</Text>
              </View>
            </View>
            <View>
              <Text style={s.receipt}>RECEIPT</Text>
              <View style={[s.metaRow, { marginTop: 6 }]}><Text style={s.metaKey}>Receipt No.</Text><Text style={s.metaVal}>{billNoText(bill.billNo)}</Text></View>
              <View style={s.metaRow}><Text style={s.metaKey}>Date</Text><Text style={s.metaVal}>{fmt(bill.paidAt ?? bill.createdAt, { dateStyle: 'medium' })}</Text></View>
              <Text style={s.stamp}>{bill.status === 'paid' ? 'PAID' : bill.status === 'void' ? 'VOID' : 'NOT PAID'}</Text>
            </View>
          </View>

          <View style={s.rule}>
            <View style={s.col}>
              <Text style={s.label}>Billed to</Text>
              <Text style={s.billedName}>{bill.customerName}</Text>
              {bill.customerPhone && <Text style={s.muted}>{bill.customerPhone}</Text>}
            </View>
            <View style={s.col}>
              {patientNo && (
                <>
                  <Text style={s.label}>Patient ID</Text>
                  <Text style={s.billedName}>{patientNo}</Text>
                  <Text style={s.muted}>Please quote this ID when you book or call us.</Text>
                </>
              )}
            </View>
          </View>

          <View style={s.th}>
            <Text style={[s.thText, s.cDesc]}>Description</Text>
            <Text style={[s.thText, s.cQty]}>Qty</Text>
            <Text style={[s.thText, s.cAmt]}>Amount</Text>
          </View>
          {bill.items.map((i) => (
            <View key={i.id} style={s.tr} wrap={false}>
              <View style={s.cDesc}>
                <Text style={s.itemName}>{receiptLineName(i.kind, i.description)}</Text>
                {i.kind === 'package' ? (
                  <Text style={s.itemSub}>Package session — no charge</Text>
                ) : i.quantity > 1 ? (
                  <Text style={s.itemSub}>{i.quantity} × {rm(i.unitPriceRm)}</Text>
                ) : null}
              </View>
              <Text style={s.cQty}>{i.quantity}</Text>
              <Text style={s.cAmt}>{rm(i.lineTotalRm)}</Text>
            </View>
          ))}
          <View style={[s.totRow, { marginTop: 9 }]}><Text style={s.totKey}>Subtotal</Text><Text style={s.totVal}>{rm(bill.subtotalRm)}</Text></View>
          {bill.discountRm > 0 && (
            <View style={s.totRow}><Text style={s.totKey}>Discount</Text><Text style={s.totVal}>- {rm(Math.min(bill.discountRm, bill.subtotalRm))}</Text></View>
          )}
          <View style={[s.totRow, { marginTop: 6 }]}><Text style={s.totalKey}>Total</Text><Text style={s.totalVal}>{rm(bill.totalRm)}</Text></View>

          {bill.status === 'paid' && (
            <View style={s.panel} wrap={false}>
              <View style={[s.col, { paddingRight: 14 }]}>
                <Text style={s.label}>Payment</Text>
                <Row k="Method" v={paymentLabel(bill.paymentMethod)} />
                {bill.amountReceivedRm != null && <Row k="Cash received" v={rm(bill.amountReceivedRm)} />}
                {bill.amountReceivedRm != null && <Row k="Change" v={rm(change ?? 0)} />}
                {bill.paidAt && <Row k="Paid on" v={fmt(bill.paidAt, { dateStyle: 'medium', timeStyle: 'short' })} />}
                {bill.paidByName && <Row k="Served by" v={bill.paidByName} />}
              </View>
              <View style={[s.col, { paddingLeft: 14 }]}>
                {sessions.length > 0 && (
                  <>
                    <Text style={s.label}>Package</Text>
                    {sessions.map((i) => (
                      <Row key={i.id} k={i.description.replace(/\s+—\s+session redeemed$/, '')} v={`${i.quantity} session${i.quantity > 1 ? 's' : ''} used`} />
                    ))}
                  </>
                )}
              </View>
            </View>
          )}

          <View style={s.footer}>
            <Text style={s.thanks}>Thank you for choosing {BILL_ISSUER.tradingName}.</Text>
            <Text>{BILL_ISSUER.bookingLine}</Text>
            <Text>This is a computer-generated receipt — no signature is required. · {BILL_ISSUER.website}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
