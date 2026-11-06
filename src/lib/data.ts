import { supabase } from './supabase'

type Id = string | number

const LOCAL_PRODUCTS = 'dairy-products'
const LOCAL_CUSTOMERS = 'dairy-customers'
const LOCAL_SALES = 'dairy-sales'

function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function sameId(left: Id, right: Id) {
  return String(left) === String(right)
}

export async function loadRetailData() {
  if (!supabase) {
    return {
      products: readLocal<any[]>(LOCAL_PRODUCTS, []),
      customers: readLocal<any[]>(LOCAL_CUSTOMERS, []),
      sales: readLocal<any[]>(LOCAL_SALES, []),
    }
  }

  const [products, customers, sales] = await Promise.all([
    supabase.from('products').select('*').eq('active', true).order('created_at'),
    supabase.from('customers').select('*').order('name'),
    supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false }).limit(100),
  ])
  if (products.error) throw products.error
  if (customers.error) throw customers.error
  if (sales.error) throw sales.error
  return { products: products.data, customers: customers.data, sales: sales.data }
}

export async function createProduct(product: { name: string; type: string; brand: string; size: string; stock: number; unit: string; buy: number; sell: number; reorderLevel?: number }) {
  const reorderLevel = product.reorderLevel ?? 25
  if (!supabase) {
    const data = {
      id: Date.now(),
      ...product,
      reorder_level: reorderLevel,
      active: true,
      created_at: new Date().toISOString(),
    }
    writeLocal(LOCAL_PRODUCTS, [...readLocal<any[]>(LOCAL_PRODUCTS, []), data])
    return data
  }

  const { reorderLevel: _reorderLevel, ...productData } = product
  const { data, error } = await supabase
    .from('products')
    .insert({ ...productData, reorder_level: reorderLevel })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createCustomer(customer: { name: string; phone: string }) {
  if (!supabase) {
    const data = { id: Date.now(), ...customer, credit: 0, last_purchase_at: null, created_at: new Date().toISOString() }
    writeLocal(LOCAL_CUSTOMERS, [...readLocal<any[]>(LOCAL_CUSTOMERS, []), data])
    return data
  }

  const { data, error } = await supabase.from('customers').insert(customer).select().single()
  if (error) throw error
  return data
}

export async function updateCustomer(customer: { id: Id; credit: number; lastPurchaseAt?: string }) {
  if (!supabase) {
    const customers = readLocal<any[]>(LOCAL_CUSTOMERS, [])
    const updated = customers.map(item => sameId(item.id, customer.id)
      ? { ...item, credit: customer.credit, last_purchase_at: customer.lastPurchaseAt ?? new Date().toISOString() }
      : item)
    writeLocal(LOCAL_CUSTOMERS, updated)
    return updated.find(item => sameId(item.id, customer.id)) ?? null
  }

  const { data, error } = await supabase
    .from('customers')
    .update({ credit: customer.credit, last_purchase_at: customer.lastPurchaseAt ?? new Date().toISOString() })
    .eq('id', customer.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProductStock(productId: Id, stock: number) {
  if (!supabase) {
    const products = readLocal<any[]>(LOCAL_PRODUCTS, [])
    const updated = products.map(product => sameId(product.id, productId) ? { ...product, stock } : product)
    writeLocal(LOCAL_PRODUCTS, updated)
    return updated.find(product => sameId(product.id, productId)) ?? null
  }

  const { data, error } = await supabase.from('products').update({ stock }).eq('id', productId).select().single()
  if (error) throw error
  return data
}

export async function createSale(sale: {
  customerId: Id | null
  productId: Id
  quantity: number
  amount: number
  amountPaid: number
  creditAmount: number
  profit: number
  paymentMethod: 'Cash' | 'M-Pesa' | 'Credit'
  stockAfter: number
  unitBuy: number
  unitSell: number
}) {
  const saleData = {
    customer_id: sale.customerId,
    amount: sale.amount,
    paid_amount: sale.amountPaid,
    credit_amount: sale.creditAmount,
    profit: sale.profit,
    payment_method: sale.paymentMethod,
  }

  if (!supabase) {
    const data = {
      id: `#DR-${Date.now()}`,
      ...saleData,
      created_at: new Date().toISOString(),
      sale_items: [{ product_id: sale.productId, quantity: sale.quantity }],
    }
    writeLocal(LOCAL_SALES, [data, ...readLocal<any[]>(LOCAL_SALES, [])])
    await updateProductStock(sale.productId, sale.stockAfter)
    return data
  }

  const { data, error } = await supabase.from('sales').insert(saleData).select().single()
  if (error) throw error

  const { error: itemError } = await supabase.from('sale_items').insert({
    sale_id: data.id,
    product_id: sale.productId,
    quantity: sale.quantity,
    unit_buy: sale.unitBuy,
    unit_sell: sale.unitSell,
  })
  if (itemError) throw itemError

  await updateProductStock(sale.productId, sale.stockAfter)
  return data
}
