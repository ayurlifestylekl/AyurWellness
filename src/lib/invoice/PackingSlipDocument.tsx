import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#149447' },
  meta: { fontSize: 10, color: '#666', marginBottom: 16 },
  addr: { marginBottom: 16, borderTop: '1pt solid #ddd', paddingTop: 8 },
  th: { fontWeight: 700, borderBottom: '1pt solid #149447', paddingBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottom: '0.5pt solid #eee' },
  c1: { width: '15%' },
  c2: { width: '55%' },
  c3: { width: '15%', textAlign: 'right' },
  c4: { width: '15%', textAlign: 'center' },
  noteBox: { marginTop: 16, padding: 8, backgroundColor: '#EDF4E7' },
  footer: { marginTop: 24, fontSize: 9, color: '#999' },
})

export interface PackingSlipProps {
  orderId: string
  shortId: string
  createdAt: string
  customer: { fullName: string; phone?: string | null }
  shippingAddress: {
    line1: string
    line2?: string | null
    city: string
    state: string
    postcode: string
    country: string
  }
  items: { sku: string | null; name: string; quantity: number }[]
  practitionerNote?: string | null
}

export default function PackingSlipDocument(props: PackingSlipProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Packing Slip — #{props.shortId}</Text>
        <Text style={styles.meta}>
          Ayurvedic Wellness Centre · {new Date(props.createdAt).toLocaleDateString('en-MY')}
        </Text>

        <View style={styles.addr}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>Ship to</Text>
          <Text>{props.customer.fullName}</Text>
          <Text>{props.shippingAddress.line1}</Text>
          {props.shippingAddress.line2 ? <Text>{props.shippingAddress.line2}</Text> : null}
          <Text>
            {props.shippingAddress.city}, {props.shippingAddress.state} {props.shippingAddress.postcode}
          </Text>
          <Text>{props.shippingAddress.country}</Text>
          {props.customer.phone ? <Text>Tel: {props.customer.phone}</Text> : null}
        </View>

        <View style={[styles.row, styles.th]}>
          <Text style={styles.c1}>SKU</Text>
          <Text style={styles.c2}>Product</Text>
          <Text style={styles.c3}>Qty</Text>
          <Text style={styles.c4}>Picked</Text>
        </View>
        {props.items.map((it, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.c1}>{it.sku ?? '—'}</Text>
            <Text style={styles.c2}>{it.name}</Text>
            <Text style={styles.c3}>{it.quantity}</Text>
            <Text style={styles.c4}>☐</Text>
          </View>
        ))}

        {props.practitionerNote ? (
          <View style={styles.noteBox}>
            <Text style={{ fontWeight: 700, marginBottom: 4 }}>Vaidya&apos;s note</Text>
            <Text>{props.practitionerNote}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Packed by: ____________________   Date: ____________________
        </Text>
      </Page>
    </Document>
  )
}
