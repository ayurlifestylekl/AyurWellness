import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// A6 = 105×148mm. react-pdf uses points (72 = 1in). 1mm = 2.83465pt.
const A6 = { width: 297.6, height: 419.5 }

const styles = StyleSheet.create({
  page: { padding: 14, fontSize: 9, fontFamily: 'Helvetica' },
  sender: {
    fontSize: 8,
    color: '#444',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '0.5pt solid #aaa',
  },
  toLabel: {
    fontSize: 7,
    color: '#888',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  recipient: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  addr: { fontSize: 11, lineHeight: 1.4 },
  footer: {
    marginTop: 12,
    paddingTop: 6,
    borderTop: '0.5pt solid #aaa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  shortId: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#149447',
  },
  carrier: { fontSize: 9, color: '#666', textAlign: 'right' },
  trackingNum: { fontSize: 10, color: '#444', marginTop: 2 },
})

export interface AddressLabelProps {
  shortId: string
  customerName: string
  shippingAddress: {
    line1: string
    line2?: string | null
    city: string
    state: string
    postcode: string
    country: string
  }
  customerPhone?: string | null
  carrier?: string | null
  trackingNumber?: string | null
  sender: { name: string; addressLine: string; phone: string }
}

export default function AddressLabelDocument(p: AddressLabelProps) {
  return (
    <Document>
      <Page size={A6} style={styles.page}>
        <View style={styles.sender}>
          <Text>FROM: {p.sender.name}</Text>
          <Text>{p.sender.addressLine}</Text>
          <Text>Tel: {p.sender.phone}</Text>
        </View>

        <Text style={styles.toLabel}>TO</Text>
        <Text style={styles.recipient}>{p.customerName}</Text>
        <View style={styles.addr}>
          <Text>{p.shippingAddress.line1}</Text>
          {p.shippingAddress.line2 ? <Text>{p.shippingAddress.line2}</Text> : null}
          <Text>
            {p.shippingAddress.city}, {p.shippingAddress.state} {p.shippingAddress.postcode}
          </Text>
          <Text>{p.shippingAddress.country}</Text>
          {p.customerPhone ? <Text>Tel: {p.customerPhone}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.shortId}>#{p.shortId}</Text>
          <View>
            {p.carrier ? <Text style={styles.carrier}>{p.carrier}</Text> : null}
            {p.trackingNumber ? (
              <Text style={styles.trackingNum}>{p.trackingNumber}</Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}
