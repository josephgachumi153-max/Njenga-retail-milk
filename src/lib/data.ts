import { supabase } from './supabase'

export async function loadRetailData() {
  if (!supabase) return null
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

export async function createProduct(product: { name: string; type: string; brand: string; size: string; stock: number; unit: string; buy: number; sell: number }) {
  if (!supabase) return null
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function createCustomer(customer: { name: string; phone: string }) {
  if (!supabase) return null
  const { data, error } = await supabase.from('customers').insert(customer).select().single()
  if (error) throw error
  return data
}
