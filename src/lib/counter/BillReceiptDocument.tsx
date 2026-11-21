import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Bill } from './queries'
import { billNoText, cashChange, paymentLabel, rm } from './rules'
import { BILL_ISSUER, receiptLineName } from './issuer'

const c = { ink: '#163F33', text: '#1F1F1F', muted: '#6b7a72', rule: '#d8ddd9', cream: '#F7F2E8', paid: '#047857' }

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 40, paddingHorizontal: 0, fontSize: 9.5, fontFamily: 'Helvetica', color: c.text },
  band: { height: 6, backgroundColor: c.ink },
  body: { paddingHorizontal: 40, paddingTop: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  brand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: c.ink },
  small: { fontSize: 8.5, color: c.muted, lineHeight: 1.45 },
  strong: { fontFamily: 'Helvetica-Bold', color: c.text },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: c.ink, letterSpacing: 2, textAlign: 'right' },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 },
  metaKey: { width: 70, color: c.muted, textAlign: 'right', marginRight: 8 },
  stamp: { marginTop: 8, alignSelf: 'flex-end', borderWidth: 1.5, borderColor: c.paid, color: c.paid, paddingHorizontal: 8, paddingVertical: 3, fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
  label: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#B58A3B', letterSpacing: 1.5, textTransform: 'uppercase' },
  section: { marginTop: 22, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.rule },
  th: { flexDirection: 'row', backgroundColor: c.ink, color: '#fff', paddingVertical: 5, paddingHorizontal: 6, marginTop: 20, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.6, borderBottomColor: c.rule, paddingVertical: 6, paddingHorizontal: 6 },
  cDesc: { flex: 1 },
  cQty: { width: 40, textAlign: 'center' },
  cUnit: { width: 80, textAlign: 'right' },
  cAmt: { width: 80, textAlign: 'right' },
  totRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, paddingHorizontal: 6 },
  totKey: { width: 100, textAlign: 'right', color: c.muted, marginRight: 6 },
  totVal: { width: 80, textAlign: 'right' },
  payBox: { marginTop: 20, backgroundColor: c.cream, padding: 12, borderRadius: 6 },
  payRow: { flexDirection: 'row', marginTop: 3 },
  payKey: { width: 90, color: c.muted },
  footer: { marginTop: 26, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.rule, textAlign: 'center', fontSize: 8, color: c.muted, lineHeight: 1.5 },
})

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', ...opts })

/** The counter receipt as a PDF, to download and send on WhatsApp. */
export default function BillReceiptDocument({ bill, patientNo }: { bill: Bill; patientNo: string | null }) {
  const change = bill.paymentMethod === 'cash' && bill.amountReceivedRm != null ? cashChange(bill.totalRm, bill.amountReceivedRm) : null
  return (
    <Document title={`Receipt ${billNoText(bill.billNo)}`} author={BILL_ISSUER.tradingName}>
      <Page size="A4" style={s.page}>
        <View style={s.band} />
        <View style={s.body}>
          <View style={s.header}>
            <View style={{ maxWidth: 300 }}>
              <Text style={s.brand}>{BILL_ISSUER.tradingName}</Text>
              <Text style={[s.small, s.strong, { marginTop: 6 }]}>{BILL_ISSUER.legalName}</Text>
              <Text style={s.small}>Reg. No: {BILL_ISSUER.regNo}</Text>
              {BILL_ISSUER.addressLines.map((l) => <Text key={l} style={s.small}>{l}</Text>)}
              <Text style={s.small}>{BILL_ISSUER.phones.join(' · ')}</Text>
              <Text style={s.small}>{BILL_ISSUER.email}</Text>
            </View>
            <View>
              <Text style={s.title}>RECEIPT</Text>
              <View style={s.metaRow}><Text style={s.metaKey}>Receipt No.</Text><Text style={s.strong}>{billNoText(bill.billNo)}</Text></View>
              <View style={s.metaRow}><Text style={s.metaKey}>Date</Text><Text style={s.strong}>{fmt(bill.paidAt ?? bill.createdAt, { dateStyle: 'medium' })}</Text></View>
              {bill.status === 'paid' && <Text style={s.stamp}>PAID</Text>}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.label}>Billed to</Text>
            <Text style={[s.strong, { marginTop: 4, fontSize: 10.5 }]}>{bill.customerName}</Text>
            {bill.customerPhone && <Text style={s.small}>{bill.customerPhone}</Text>}
            {patientNo && <Text style={s.small}>Patient ID: {patientNo}</Text>}
          </View>

          <View style={s.th}>
            <Text style={s.cDesc}>DESCRIPTION</Text>
            <Text style={s.cQty}>QTY</Text>
            <Text style={s.cUnit}>UNIT PRICE</Text>
            <Text style={s.cAmt}>AMOUNT</Text>
          </View>
          {bill.items.map((i) => (
            <View key={i.id} style={s.tr} wrap={false}>
              <View style={s.cDesc}>
                <Text style={s.strong}>{receiptLineName(i.kind, i.description)}</Text>
                {i.kind === 'package' && <Text style={s.small}>Package session — no charge</Text>}
              </View>
              <Text style={s.cQty}>{i.quantity}</Text>
              <Text style={s.cUnit}>{rm(i.unitPriceRm)}</Text>
              <Text style={s.cAmt}>{rm(i.lineTotalRm)}</Text>
            </View>
          ))}
          <View style={[s.totRow, { marginTop: 8 }]}><Text style={s.totKey}>Subtotal</Text><Text style={s.totVal}>{rm(bill.subtotalRm)}</Text></View>
          {bill.discountRm > 0 && (
            <View style={s.totRow}><Text style={s.totKey}>Discount</Text><Text style={s.totVal}>- {rm(Math.min(bill.discountRm, bill.subtotalRm))}</Text></View>
          )}
          <View style={s.totRow}>
            <Text style={[s.totKey, { color: c.ink, fontFamily: 'Helvetica-Bold' }]}>Total</Text>
            <Text style={[s.totVal, { color: c.ink, fontFamily: 'Helvetica-Bold', fontSize: 12 }]}>{rm(bill.totalRm)}</Text>
          </View>

          {bill.status === 'paid' && (
            <View style={s.payBox} wrap={false}>
              <Text style={s.label}>Payment</Text>
              <View style={s.payRow}><Text style={s.payKey}>Method</Text><Text>{paymentLabel(bill.paymentMethod)}</Text></View>
              {bill.amountReceivedRm != null && (
                <>
                  <View style={s.payRow}><Text style={s.payKey}>Cash received</Text><Text>{rm(bill.amountReceivedRm)}</Text></View>
                  <View style={s.payRow}><Text style={s.payKey}>Change</Text><Text>{rm(change ?? 0)}</Text></View>
                </>
              )}
              {bill.paidAt && <View style={s.payRow}><Text style={s.payKey}>Paid on</Text><Text>{fmt(bill.paidAt, { dateStyle: 'medium', timeStyle: 'short' })}</Text></View>}
              {bill.paidByName && <View style={s.payRow}><Text style={s.payKey}>Served by</Text><Text>{bill.paidByName}</Text></View>}
            </View>
          )}

          <View style={s.footer}>
            <Text style={{ color: c.ink, fontFamily: 'Helvetica-Bold' }}>Thank you for choosing {BILL_ISSUER.tradingName}.</Text>
            <Text>This is a computer-generated receipt — no signature is required. · {BILL_ISSUER.website}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
