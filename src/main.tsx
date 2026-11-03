import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { createCustomer, createProduct, loadRetailData } from './lib/data'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Product = { id: number; name: string; brand: string; type: 'Milk' | 'Yoghurt' | 'Sour/Mala'; size: string; stock: number; unit: string; buy: number; sell: number; color: string }
type Sale = { id: string; product: string; customer?: string; qty: string; amount: number; profit?: number; time: string; method: string; color: string }
type Customer = { id: number; name: string; phone: string; credit: number; lastPurchase: string }

const initialProducts: Product[] = []

const initialSales: Sale[] = []
const initialCustomers: Customer[] = []

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<string, ReactElement> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    box: <><path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></>,
    cart: <><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 1.9-1.5L22 8H6"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a2 2 0 1 1-4 0V19a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 12.1v-.2a1.7 1.7 0 0 0-1.2-1.6A2 2 0 1 1 4.6 6.8l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.3a2 2 0 1 1 4 0v.3a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.3a2 2 0 1 1 0 4h-.3a1.7 1.7 0 0 0-1.2.9Z"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const LOGIN_NAME = 'Kenneth Njenga'
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim() || !password) { setError('Enter your name and password to continue.'); return }
    const loginPassword = localStorage.getItem('dairy-login-password') ?? 'Matrixx@2026'
    if (name.trim() !== LOGIN_NAME || password !== loginPassword) { setError('Incorrect username or password.'); return }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email: 'admin@njenga-milk.local', password })
      if (error) { setError(error.message); return }
    }
    sessionStorage.setItem('dairy-session', 'active'); onLogin()
  }
  return <div className="login-page"><div className="login-card"><div className="login-brand"><div className="brand-mark">✦</div><div><strong>Dairy<span>Desk</span></strong><small>RETAIL MANAGEMENT</small></div></div><div className="login-copy"><div className="eyebrow">WELCOME BACK</div><h1>Sign in to your store</h1><p>Manage inventory, sales, customers, and credit in one place.</p></div><form onSubmit={submit}><label>Your name<input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" autoComplete="name"/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn login-button" type="submit">Sign in <Icon name="arrow" size={16}/></button></form><small className="login-footer">Your account data stays private and secure.</small></div></div>
}

function SettingsPanel() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const saved = localStorage.getItem('dairy-login-password') ?? 'Matrixx@2026'
    if (current !== saved) { setMessage('Current password is incorrect.'); return }
    if (next.length < 8) { setMessage('New password must be at least 8 characters.'); return }
    if (next !== confirm) { setMessage('New passwords do not match.'); return }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) { setMessage(error.message); return }
    }
    localStorage.setItem('dairy-login-password', next); setCurrent(''); setNext(''); setConfirm(''); setMessage('Password updated successfully.')
  }
  return <div className="settings-panel"><div className="settings-card"><div className="eyebrow">ACCOUNT SECURITY</div><h2>Change password</h2><p>Update the password used to sign in to DairyDesk.</p><form onSubmit={savePassword}><label>Current password<input type="password" value={current} onChange={e => setCurrent(e.target.value)} /></label><label>New password<input type="password" value={next} onChange={e => setNext(e.target.value)} /></label><label>Confirm new password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>{message && <p className={message.includes('successfully') ? 'settings-success' : 'form-error'}>{message}</p>}<button className="primary-btn" type="submit">Save new password <Icon name="arrow" size={16}/></button></form></div></div>
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('dairy-session') === 'active')
  if (!isAuthenticated) return <LoginPage onLogin={() => setIsAuthenticated(true)} />
  const [active, setActive] = useState('Overview')
  const [products, setProducts] = useState(initialProducts)
  const [sales, setSales] = useState(initialSales)
  const [customers, setCustomers] = useState(initialCustomers)
  const [modal, setModal] = useState(false)
  const [saleFormModal, setSaleFormModal] = useState(false)
  const [stockModal, setStockModal] = useState(false)
  const [selected, setSelected] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [boxes, setBoxes] = useState(1)
  const [loosePieces, setLoosePieces] = useState(0)
  const [supplier, setSupplier] = useState('Brookside Dairy')
  const [customerName, setCustomerName] = useState('Walk-in customer')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [customerModal, setCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' })
  const [productModal, setProductModal] = useState(false)
  const [newProduct, setNewProduct] = useState({ variety: 'Fresh Milk', type: 'Milk' as Product['type'], size: '500 ml', quantity: 1, unitsPerBox: 12, buy: 48, sell: 60, company: 'Brookside' })
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('All items')
  const revenue = useMemo(() => sales.reduce((sum, sale) => sum + sale.amount, 0), [sales])
  const profit = useMemo(() => sales.reduce((sum, sale) => sum + (sale.profit ?? 0), 0), [sales])
  const filtered = filter === 'All items' ? products : products.filter(p => p.type === filter)

  useEffect(() => {
    let cancelled = false
    loadRetailData().then(data => {
      if (cancelled || !data) return
      setProducts(data.products.map((p: any) => ({ ...p, id: p.id as unknown as number, color: p.type === 'Yoghurt' ? 'rose' : 'mint' })))
      setCustomers(data.customers.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, credit: Number(c.credit), lastPurchase: c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString() : 'No purchases' })))
      setSales(data.sales.map((s: any) => ({ id: s.id, product: 'Recorded sale', customer: s.customer_id, qty: `${(s.sale_items ?? []).reduce((sum: number, item: any) => sum + item.quantity, 0)} pcs`, amount: Number(s.amount), profit: Number(s.profit), time: new Date(s.created_at).toLocaleString(), method: s.payment_method, color: 'mint' })))
    }).catch(error => setNotice(error instanceof Error ? error.message : 'Unable to load Supabase data'))
    return () => { cancelled = true }
  }, [])

  const recordSale = () => {
    const item = products[selected]
    const amount = item.sell * quantity
    setProducts(products.map(p => p.id === item.id ? { ...p, stock: Math.max(0, p.stock - quantity) } : p))
    setSales([{ id: `#DR-${1049 + sales.length}`, product: `${item.name} · ${item.brand} ${item.size}`, customer: customerName, qty: `${quantity} ${quantity === 1 ? 'pc' : 'pcs'}`, amount, profit: (item.sell - item.buy) * quantity, time: 'just now', method: paymentMethod, color: item.color }, ...sales])
    const existingCustomer = customers.find(customer => customer.name.toLowerCase() === customerName.trim().toLowerCase())
    if (customerName.trim() && customerName.trim() !== 'Walk-in customer') {
      if (existingCustomer) {
        setCustomers(customers.map(customer => customer.id === existingCustomer.id ? { ...customer, credit: customer.credit + (paymentMethod === 'Credit' ? amount : 0), lastPurchase: 'Today' } : customer))
      } else {
        setCustomers([...customers, { id: Date.now(), name: customerName.trim(), phone: '—', credit: paymentMethod === 'Credit' ? amount : 0, lastPurchase: 'Today' }])
      }
    }
    setModal(false); setSaleFormModal(false); setQuantity(1); setNotice('Sale recorded and inventory updated')
    setTimeout(() => setNotice(''), 3000)
  }
  const addCustomer = () => {
    if (!newCustomer.name.trim()) return
    setCustomers([...customers, { id: Date.now(), name: newCustomer.name.trim(), phone: newCustomer.phone || '—', credit: 0, lastPurchase: 'No purchases' }])
    void createCustomer({ name: newCustomer.name.trim(), phone: newCustomer.phone || '' }).catch(error => setNotice(error instanceof Error ? error.message : 'Unable to save customer'))
    setNewCustomer({ name: '', phone: '' }); setCustomerModal(false); setNotice('Customer added successfully'); setTimeout(() => setNotice(''), 3000)
  }
  const openSale = () => {
    if (!products.length) { setActive('Inventory'); setNotice('Add a product to inventory before recording a sale'); setTimeout(() => setNotice(''), 3500); return }
    setSaleFormModal(true)
  }
  const receiveStock = () => {
    const item = products[selected]
    const received = boxes * 12 + loosePieces
    setProducts(products.map(p => p.id === item.id ? { ...p, stock: p.stock + received } : p))
    setStockModal(false); setBoxes(1); setLoosePieces(0); setNotice(`${received} pieces of ${item.name} received from ${supplier}`)
    setTimeout(() => setNotice(''), 3500)
  }
  const addProduct = () => {
    const isYoghurt = newProduct.type === 'Yoghurt'
    const stock = newProduct.quantity * newProduct.unitsPerBox
    const color = newProduct.variety.toLowerCase().includes('strawberry') ? 'coral' : isYoghurt ? 'rose' : newProduct.type === 'Sour/Mala' ? 'gold' : 'mint'
    const product: Product = { id: Date.now(), name: newProduct.variety, brand: newProduct.company, type: newProduct.type, size: newProduct.size, stock, unit: isYoghurt ? 'packages' : 'pieces', buy: newProduct.buy, sell: newProduct.sell, color }
    setProducts([...products, product]); setProductModal(false); setNotice(`${product.name} added with ${stock} ${product.unit}`)
    void createProduct({ name: product.name, type: product.type, brand: product.brand, size: product.size, stock: product.stock, unit: product.unit, buy: product.buy, sell: product.sell }).catch(error => setNotice(error instanceof Error ? error.message : 'Unable to save product'))
    setTimeout(() => setNotice(''), 3500)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">✦</div><div><strong>Dairy<span>Desk</span></strong><small>RETAIL MANAGEMENT</small></div></div>
      <div className="store-switch"><div className="store-icon">M</div><div><b>Milk Point · CBD</b><small>MAIN OUTLET</small></div><span>⌄</span></div>
      <nav><div className="nav-label">WORKSPACE</div>{[['Overview','grid'],['Inventory','box'],['Sales & POS','cart'],['Customers','user'],['Reports','chart']].map(([label, icon]) => <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => setActive(label)}><Icon name={icon}/>{label}{label === 'Inventory' && <em>3</em>}</button>)}<div className="nav-label second">MANAGE</div><button className="nav-item" onClick={() => setActive('Settings')}><Icon name="settings"/>Settings</button></nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><div><b>Need a hand?</b><small>View getting started guide</small></div><Icon name="arrow" size={15}/></div><div className="profile"><div className="avatar">KN</div><div><b>Kenneth Njenga</b><small>Administrator</small></div><Icon name="more" size={16}/></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><span>Milk Point · CBD</span><b>/</b><strong>{active}</strong></div><div className="top-actions"><div className="date-pill">Nov 03, 2026 <span>⌄</span></div><button className="icon-button"><Icon name="bell"/><i></i></button><div className="top-avatar">JM</div></div></header>
      {active !== 'Overview' ? active === 'Settings' ? <SettingsPanel /> : <section className="placeholder-page"><div className="eyebrow">DAIRYDESK / {active.toUpperCase()}</div><h1>{active}</h1><p>{active === 'Customers' ? 'Customers, purchase history and outstanding credit.' : 'This workspace is ready for your next operation.'}</p>{active === 'Inventory' ? <div className="action-row"><button className="primary-btn" onClick={() => setProductModal(true)}><Icon name="plus" size={17}/> Add product</button><button className="secondary-btn" onClick={() => setStockModal(true)}><Icon name="box" size={16}/> Receive stock</button></div> : active === 'Customers' ? <><button className="primary-btn" onClick={() => setCustomerModal(true)}><Icon name="plus" size={17}/> Add customer</button><div className="customer-list">{customers.map(customer => <div className="customer-card" key={customer.id}><div className="customer-avatar">{customer.name.slice(0, 1)}</div><div className="customer-info"><b>{customer.name}</b><small>{customer.phone} · Last purchase: {customer.lastPurchase}</small></div><div className="customer-credit"><small>OUTSTANDING CREDIT</small><b className={customer.credit ? 'credit-due' : 'credit-clear'}>KES {customer.credit.toLocaleString()}</b></div></div>)}</div></> : <button className="primary-btn" onClick={openSale}><Icon name="plus" size={17}/> Record a sale</button>}</section> : <>
      <section className="welcome-row"><div><div className="eyebrow">TODAY</div><h1>Welcome to DairyDesk <span>✦</span></h1><p>Start by adding your products and recording your first sale.</p></div><button className="primary-btn" onClick={openSale}><Icon name="plus" size={17}/> Record a sale</button></section>
      <section className="stats-grid"><div className="stat-card revenue"><div className="stat-top"><span className="stat-icon">↗</span><span className="muted-pill">TODAY</span></div><small>TODAY’S REVENUE</small><strong>KES {revenue.toLocaleString()}</strong><p>Live sales total</p></div><div className="stat-card"><div className="stat-top"><span className="stat-icon box-icon"><Icon name="box" size={17}/></span><span className="muted-pill">STOCK</span></div><small>TOTAL STOCK</small><strong>{products.reduce((sum, p) => sum + p.stock, 0)} <b className="unit-label">items</b></strong><p>{products.length ? 'Inventory is ready' : 'Add your first product'}</p></div><div className="stat-card"><div className="stat-top"><span className="stat-icon profit-icon">↗</span><span className="muted-pill">TODAY</span></div><small>EST. PROFIT TODAY</small><strong>KES {profit.toLocaleString()}</strong><p>Calculated from completed sales</p></div></section>
      <section className="content-grid"><div className="panel sales-panel"><div className="panel-heading"><div><h2>Recent sales</h2><p>Transactions recorded today</p></div><button className="text-btn" onClick={() => setActive('Sales & POS')}>View all <Icon name="arrow" size={14}/></button></div><div className="sales-list">{sales.slice(0,4).map(sale => <div className="sale-row" key={sale.id}><div className={`product-thumb ${sale.color}`}>{sale.product.includes('Yoghurt') ? '◒' : '◓'}</div><div className="sale-product"><b>{sale.product}</b><small>{sale.id} · {sale.qty}</small></div><div className="sale-method">{sale.method === 'M-Pesa' ? <span className="mpesa">M</span> : <span className="cash">$</span>}{sale.method}</div><div className="sale-amount">KES {sale.amount.toLocaleString()}<small>{sale.time}</small></div><Icon name="more" size={16}/></div>)}</div></div><div className="panel chart-panel"><div className="panel-heading"><div><h2>Sales overview</h2><p>Revenue performance</p></div><select><option>Last 7 days</option><option>Last 30 days</option></select></div><div className="chart-total"><strong>KES 42,680</strong><span className="trend">+18.6%</span><small>vs. previous week</small></div><div className="chart"><div className="chart-y"><span>8k</span><span>6k</span><span>4k</span><span>2k</span><span>0</span></div><svg viewBox="0 0 500 170" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4db6a1" stopOpacity=".3"/><stop offset="1" stopColor="#4db6a1" stopOpacity="0"/></linearGradient></defs><path d="M0,135 C25,140 35,102 62,116 S88,122 110,107 S135,116 157,87 S181,105 202,90 S224,99 245,72 S270,105 290,80 S315,83 334,62 S356,81 378,59 S400,74 422,42 S450,64 470,25 S490,35 500,20 L500,170 L0,170Z" fill="url(#fill)"/><path d="M0,135 C25,140 35,102 62,116 S88,122 110,107 S135,116 157,87 S181,105 202,90 S224,99 245,72 S270,105 290,80 S315,83 334,62 S356,81 378,59 S400,74 422,42 S450,64 470,25 S490,35 500,20" fill="none" stroke="#3aa895" strokeWidth="3"/></svg><div className="chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></section>
      <section className="bottom-grid"><div className="panel inventory-panel"><div className="panel-heading"><div><h2>Inventory snapshot</h2><p>Stock levels by product</p></div><button className="text-btn" onClick={() => setActive('Inventory')}>Manage inventory <Icon name="arrow" size={14}/></button></div><div className="filter-tabs">{['All items','Milk','Yoghurt'].map(item => <button className={filter === item ? 'selected' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><table><thead><tr><th>PRODUCT</th><th>STOCK</th><th>UNIT PRICE</th><th>STATUS</th><th></th></tr></thead><tbody>{filtered.slice(0,4).map(item => <tr key={item.id}><td><div className="table-product"><div className={`product-thumb sm ${item.color}`}>{item.type === 'Yoghurt' ? '◒' : '◓'}</div><div><b>{item.name}</b><small>{item.brand} · {item.size}</small></div></div></td><td><b>{item.stock}</b> <span className="muted">{item.unit}</span></td><td><b>KES {item.sell}</b></td><td><span className={item.stock < 25 ? 'status low' : 'status good'}><i></i>{item.stock < 25 ? 'Low stock' : 'In stock'}</span></td><td><Icon name="more" size={16}/></td></tr>)}</tbody></table></div><div className="panel profit-panel"><div className="panel-heading"><div><h2>Profit breakdown</h2><p>Today’s performance</p></div><Icon name="more" size={17}/></div><div className="profit-hero"><span>NET PROFIT</span><strong>KES {profit.toLocaleString()}</strong><div className="progress-ring"><div><b>22.5%</b><small>margin</small></div></div></div><div className="breakdown"><div><span><i className="dot teal"></i>Sales revenue</span><b>KES {revenue.toLocaleString()}</b></div><div><span><i className="dot gold-dot"></i>Cost of goods</span><b className="expense">− KES {(revenue - profit).toLocaleString()}</b></div><div><span><i className="dot gray-dot"></i>Operating costs</span><b className="expense">− KES 1,240</b></div></div><div className="profit-footer"><span>Compared to yesterday</span><b>↗ 8.4%</b></div></div></section>
      </>}
    </main>
    {notice && <div className="toast">✓ {notice}</div>}
    {customerModal && <div className="modal-backdrop" onClick={() => setCustomerModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">CUSTOMERS</div><h2>Add customer</h2></div><button className="close-btn" onClick={() => setCustomerModal(false)}><Icon name="close"/></button></div><label>Customer name<input value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="e.g. Grace Wanjiku"/></label><label>Phone number<input value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="e.g. 0712 345 678"/></label><button className="primary-btn full" onClick={addCustomer}>Save customer <Icon name="arrow" size={16}/></button></div></div>}
    {saleFormModal && <div className="modal-backdrop" onClick={() => setSaleFormModal(false)}><div className="modal wide-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">POINT OF SALE / CUSTOMER</div><h2>Record a sale</h2></div><button className="close-btn" onClick={() => setSaleFormModal(false)}><Icon name="close"/></button></div><label>Product<select value={selected} onChange={e => setSelected(Number(e.target.value))}>{products.map((p, i) => <option value={i} key={p.id}>{p.name} — {p.brand} {p.size} — KES {p.sell}</option>)}</select></label><div className="form-grid"><label>Quantity sold<input type="number" min="1" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}/></label><label>Customer name<input list="customer-options" value={customerName === 'Walk-in customer' ? '' : customerName} onChange={e => setCustomerName(e.target.value || 'Walk-in customer')} placeholder="Type existing or new customer"/><datalist id="customer-options">{customers.map(customer => <option key={customer.id} value={customer.name}/>)}</datalist></label><label>Payment method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Cash</option><option>M-Pesa</option><option>Credit</option></select></label><label>Customer credit balance<input readOnly value={customerName === 'Walk-in customer' ? 'KES 0' : `KES ${(customers.find(c => c.name.toLowerCase() === customerName.toLowerCase())?.credit ?? 0).toLocaleString()}`}/></label></div><div className="sale-total"><span>Total sale {paymentMethod === 'Credit' && <small>· added to customer credit</small>}</span><strong>KES {(products[selected].sell * quantity).toLocaleString()}</strong></div><button className="primary-btn full" onClick={recordSale}>Complete sale <Icon name="arrow" size={16}/></button></div></div>}
    {productModal && <div className="modal-backdrop" onClick={() => setProductModal(false)}><div className="modal wide-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">INVENTORY / PRODUCT SETUP</div><h2>Add product</h2></div><button className="close-btn" onClick={() => setProductModal(false)}><Icon name="close"/></button></div><div className="form-grid"><label>Product variety<input value={newProduct.variety} onChange={e => setNewProduct({ ...newProduct, variety: e.target.value })} placeholder="e.g. Vanilla Yoghurt"/></label><label>Product type<select value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value as Product['type'] })}><option>Milk</option><option>Yoghurt</option><option>Sour/Mala</option></select></label><label>Pack size<select value={newProduct.size} onChange={e => setNewProduct({ ...newProduct, size: e.target.value })}><option>250 ml</option><option>350 ml</option><option>500 ml</option><option>1 litre</option><option>2 litres</option></select></label><label>Company / brand<input value={newProduct.company} onChange={e => setNewProduct({ ...newProduct, company: e.target.value })} placeholder="e.g. Brookside"/></label><label>{newProduct.type === 'Yoghurt' ? 'Packages received' : 'Boxes received'}<input type="number" min="1" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: Math.max(1, Number(e.target.value)) })}/></label><label>Units per {newProduct.type === 'Yoghurt' ? 'package' : 'box'}<input type="number" min="1" value={newProduct.unitsPerBox} onChange={e => setNewProduct({ ...newProduct, unitsPerBox: Math.max(1, Number(e.target.value)) })}/></label><label>Buying price / unit<input type="number" min="0" value={newProduct.buy} onChange={e => setNewProduct({ ...newProduct, buy: Math.max(0, Number(e.target.value)) })}/></label><label>Selling price / unit<input type="number" min="0" value={newProduct.sell} onChange={e => setNewProduct({ ...newProduct, sell: Math.max(0, Number(e.target.value)) })}/></label></div><div className="product-preview"><span>Opening stock: <b>{newProduct.quantity * newProduct.unitsPerBox} pieces</b></span><span>Profit / unit: <b className={newProduct.sell >= newProduct.buy ? 'profit-positive' : 'profit-negative'}>KES {newProduct.sell - newProduct.buy}</b></span></div><button className="primary-btn full" onClick={addProduct}>Add product to inventory <Icon name="arrow" size={16}/></button></div></div>}
    {stockModal && <div className="modal-backdrop" onClick={() => setStockModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">INVENTORY / INCOMING STOCK</div><h2>Receive stock</h2></div><button className="close-btn" onClick={() => setStockModal(false)}><Icon name="close"/></button></div><label>Product<select value={selected} onChange={e => setSelected(Number(e.target.value))}>{products.map((p, i) => <option value={i} key={p.id}>{p.name} · {p.brand} {p.size}</option>)}</select></label><label>Supplier<select value={supplier} onChange={e => setSupplier(e.target.value)}><option>Brookside Dairy</option><option>KCC</option><option>Bio Foods</option><option>Other supplier</option></select></label><div className="split-fields"><label>Boxes received<input type="number" min="0" value={boxes} onChange={e => setBoxes(Math.max(0, Number(e.target.value)))}/></label><label>Loose pieces<input type="number" min="0" value={loosePieces} onChange={e => setLoosePieces(Math.max(0, Number(e.target.value)))}/></label></div><div className="sale-total"><span>Stock to add <small>(12 pieces per box)</small></span><strong>{boxes * 12 + loosePieces} pcs</strong></div><button className="primary-btn full" onClick={receiveStock}>Add to inventory <Icon name="arrow" size={16}/></button></div></div>}
    {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">POINT OF SALE</div><h2>Record a sale</h2></div><button className="close-btn" onClick={() => setModal(false)}><Icon name="close"/></button></div><label>Product<select value={selected} onChange={e => setSelected(Number(e.target.value))}>{products.map((p, i) => <option value={i} key={p.id}>{p.name} · {p.brand} {p.size} — KES {p.sell}</option>)}</select></label><label>Quantity <span className="field-hint">sold by piece</span><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity(quantity + 1)}>+</button></div></label><div className="sale-total"><span>Total to collect</span><strong>KES {(products[selected].sell * quantity).toLocaleString()}</strong></div><button className="primary-btn full" onClick={recordSale}>Complete sale <Icon name="arrow" size={16}/></button></div></div>}
  </div>
}

createRoot(document.getElementById('root')!).render(<App />)
