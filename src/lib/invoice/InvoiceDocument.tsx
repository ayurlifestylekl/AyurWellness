import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { OrderWithItems } from '@/lib/dashboard/order-queries'

interface InvoiceDocumentProps {
  order: OrderWithItems
  customer: {
    fullName: string
    email: string
  }
}

const colors = {
  ink: '#12372D',
  inkSoft: '#12372D',
  muted: '#7a8a82',
  rule: '#d8ddd9',
  gold: '#B58A3B',
  cream: '#EDF4E7',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.inkSoft,
    backgroundColor: '#ffffff',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  brandBlock: { width: '60%' },
  brandName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  brandMeta: { fontSize: 9, color: colors.muted, lineHeight: 1.5 },

  receiptBadge: {
    alignItems: 'flex-end',
  },
  receiptLabel: {
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
  },
  receiptDate: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 4,
  },

  goldRule: {
    height: 1.2,
    backgroundColor: colors.gold,
    marginBottom: 24,
  },

  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  col: { width: '48%' },
  colLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  colValue: {
    fontSize: 11,
    color: colors.ink,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  colSub: { fontSize: 9, color: colors.muted, lineHeight: 1.4 },

  itemsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    paddingBottom: 6,
    marginBottom: 4,
  },
  itemsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.rule,
  },
  thName: {
    flex: 4,
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  thQty: {
    flex: 1,
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  thPrice: {
    flex: 1.2,
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'right',
  },
  thLine: {
    flex: 1.4,
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'right',
  },
  tdName: { flex: 4, fontSize: 10, color: colors.ink, paddingRight: 8 },
  tdQty: { flex: 1, fontSize: 10, color: colors.inkSoft, textAlign: 'center' },
  tdPrice: { flex: 1.2, fontSize: 10, color: colors.inkSoft, textAlign: 'right' },
  tdLine: {
    flex: 1.4,
    fontSize: 10,
    color: colors.ink,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  totalBox: {
    width: '40%',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cream,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  totalLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.ink,
  },
  paidBadge: {
    marginTop: 6,
    fontSize: 8,
    color: '#149447',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontFamily: 'Helvetica-Bold',
  },

  footer: {
    position: 'absolute',
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: colors.rule,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerNote: { fontSize: 8, color: colors.muted, lineHeight: 1.5 },
  footerThanks: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: colors.ink,
  },
})

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

function fmtMoney(v: number | null | undefined): string {
  return `RM ${Number(v ?? 0).toFixed(2)}`
}

const dateFormatter = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function InvoiceDocument({ order, customer }: InvoiceDocumentProps) {
  const total = Number(order.total_amount_rm ?? 0)
  const placed = dateFormatter.format(new Date(order.created_at))

  return (
    <Document
      title={`Ayurvedic Wellness Centre Receipt #${shortId(order.id)}`}
      author="Ayurvedic Wellness Centre"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Ayurvedic Wellness Centre</Text>
            <Text style={styles.brandTagline}>Authentic traditional Ayurveda</Text>
            <Text style={styles.brandMeta}>
              Brickfields, Kuala Lumpur{'\n'}
              +6011-6339 3436{'\n'}
              hello@ayurvedawellness.com.my
            </Text>
          </View>
          <View style={styles.receiptBadge}>
            <Text style={styles.receiptLabel}>Receipt</Text>
            <Text style={styles.receiptNumber}>#{shortId(order.id)}</Text>
            <Text style={styles.receiptDate}>{placed}</Text>
          </View>
        </View>

        <View style={styles.goldRule} />

        {/* Billed to / Order info */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Billed to</Text>
            <Text style={styles.colValue}>{customer.fullName || 'Member'}</Text>
            <Text style={styles.colSub}>{customer.email}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Fulfillment</Text>
            <Text style={styles.colValue}>
              {order.fulfillment_status.charAt(0).toUpperCase() + order.fulfillment_status.slice(1)}
            </Text>
            {order.courier_service && (
              <Text style={styles.colSub}>
                {order.courier_service}
                {order.tracking_number ? ` · ${order.tracking_number}` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsHeader}>
          <Text style={styles.thName}>Item</Text>
          <Text style={styles.thQty}>Qty</Text>
          <Text style={styles.thPrice}>Unit</Text>
          <Text style={styles.thLine}>Line total</Text>
        </View>
        {order.items.map((it) => {
          const unit = Number(it.price_at_purchase_rm)
          const line = unit * it.quantity
          return (
            <View key={it.id} style={styles.itemsRow}>
              <Text style={styles.tdName}>{it.product?.name ?? 'Product'}</Text>
              <Text style={styles.tdQty}>{it.quantity}</Text>
              <Text style={styles.tdPrice}>{fmtMoney(unit)}</Text>
              <Text style={styles.tdLine}>{fmtMoney(line)}</Text>
            </View>
          )
        })}

        {/* Total */}
        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalValue}>{fmtMoney(total)}</Text>
            <Text style={styles.paidBadge}>Paid in full</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerNote}>
            Ayurvedic Wellness Centre{'\n'}
            For HR reimbursement, contact us for our SSM registration.
          </Text>
          <Text style={styles.footerThanks}>Thank you for your practice.</Text>
        </View>
      </Page>
    </Document>
  )
}

export default InvoiceDocument
