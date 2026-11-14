import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Drawer } from 'vaul'
import {
  ArrowLeft,
  ArrowRight,
  Bone,
  Check,
  ChevronDown,
  Minus,
  Menu,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { fetchStore, placeDemoOrder } from '../data/api'
import type { CartLine, Product, ProductVariant, Store } from '../data/types'

const currencyFormat = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

function priceInEuros(cents: number) {
  return currencyFormat.format(cents / 100)
}

function ProductArtwork({
  product,
  storeId,
}: {
  product: Product
  storeId: string
}) {
  const isTin = product.art.startsWith('tin')
  const isPouch = product.art.startsWith('pouch')
  const productPhoto: Record<string, string> = {
    'trail-mix': '/images/paw-forest.webp',
    coastline: '/images/paw-field.webp',
    'garden-bowl': '/images/paw-portrait.webp',
    'beach-bites': '/images/paw-walk.webp',
    'calm-chews': '/images/paw-field.webp',
    'picnic-pate': '/images/paw-portrait.webp',
  }

  return (
    <div
      className={`product-artwork artwork-food ${product.art}`}
      aria-hidden="true"
      style={{
        backgroundImage: `linear-gradient(0deg, rgba(25, 39, 28, .28), rgba(255, 250, 232, .08)), url("${productPhoto[product.id] || '/images/paw-forest.webp'}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`food-pack ${isTin ? 'food-tin' : ''} ${isPouch ? 'food-pouch' : ''}`}>
        <span className="pack-brand">{storeId === 'paw-pantry' ? 'P&P' : 'DEMO'}</span>
        <Bone className="pack-bone" size={15} strokeWidth={1.5} />
        <span className="pack-product-name">{product.name}</span>
        <span className="pack-caption">SAMPLE RECIPE</span>
      </div>
      <span className="artwork-ground" />
      <span className="artwork-spark spark-one">✳</span>
      <span className="artwork-spark spark-two">✳</span>
    </div>
  )
}

function resolveCartProduct(store: Store, line: CartLine) {
  const product = store.products.find((entry) => entry.id === line.productId)
  const variant = product?.variants.find((entry) => entry.id === line.variantId)
  return product && variant ? { product, variant } : undefined
}

export function StoreDemo({ storeId }: { storeId: string }) {
  const [searchParams] = useSearchParams()
  const isEmbedded = searchParams.get('embed') === '1'
  const [store, setStore] = useState<Store | null>(null)
  const [loadError, setLoadError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('featured')
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetchStore(storeId)
      .then((data) => {
        if (alive) setStore(data)
      })
      .catch((error: unknown) => {
        if (alive) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load this demo store.')
        }
      })
    return () => {
      alive = false
    }
  }, [storeId])

  const products = useMemo(() => {
    if (!store) return []
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const visibleProducts = store.products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
    if (sortOrder === 'price-low' || sortOrder === 'price-high') {
      const direction = sortOrder === 'price-low' ? 1 : -1
      return visibleProducts.sort((first, second) => {
        const firstPrice = Math.min(...first.variants.map((variant) => variant.price))
        const secondPrice = Math.min(...second.variants.map((variant) => variant.price))
        return (firstPrice - secondPrice) * direction
      })
    }
    return visibleProducts
  }, [activeCategory, searchTerm, sortOrder, store])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartRows = store
    ? cart.flatMap((line) => {
        const resolved = resolveCartProduct(store, line)
        return resolved ? [{ ...line, ...resolved }] : []
      })
    : []
  const cartTotal = cartRows.reduce(
    (total, row) => total + row.variant.price * row.quantity,
    0,
  )

  function selectVariant(productId: string, variantId: string) {
    setSelectedVariants((current) => ({ ...current, [productId]: variantId }))
  }

  function addToCart(product: Product, variant: ProductVariant) {
    setCart((current) => {
      const key = `${product.id}:${variant.id}`
      const existing = current.find((line) => line.key === key)
      if (existing) {
        if (existing.quantity >= 20) {
          toast.error('The demo basket limit is 20 of each option.')
          return current
        }
        return current.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [
        ...current,
        { key, productId: product.id, variantId: variant.id, quantity: 1 },
      ]
    })
    toast.success(`${product.name} added to your demo basket.`)
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, quantity: Math.min(20, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!store || cart.length === 0) return
    const form = event.currentTarget
    const formData = new FormData(form)
    setCheckoutBusy(true)
    try {
      const result = await placeDemoOrder({
        storeId,
        name: String(formData.get('name') || ''),
        email: String(formData.get('email') || ''),
        items: cart.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        })),
      })
      toast.success(`Demo order recorded · ${result.orderId.slice(0, 8)}`)
      setCart([])
      form.reset()
      setCartOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record this demo order.')
    } finally {
      setCheckoutBusy(false)
    }
  }

  if (loadError) {
    return (
      <main className="store-load-error">
        <p className="eyebrow">DEMO SHOP</p>
        <h1>Store data is unavailable.</h1>
        <p>{loadError}</p>
        <Button asChild variant="secondary"><Link to="/">Back to the portfolio</Link></Button>
      </main>
    )
  }

  if (!store) {
    return (
      <main className="store-loading" aria-live="polite">
        <span className="loading-mark">✳</span>
        <span>Loading the demo store…</span>
      </main>
    )
  }

  return (
      <main className={`store-page store-${store.accent} ${isEmbedded ? 'store-embedded' : ''}`}>
      <div className="demo-ribbon">
        <Link to="/" className="back-portfolio"><ArrowLeft size={14} /> Andrey Lozov · Portfolio</Link>
        <span><span className="demo-ribbon-dot" /> Fictional concept · sample data · no payment taken</span>
      </div>

      <header className="store-header">
        <div className="store-container store-nav">
          <a className="store-logo" href="#store-top">
            <span className="store-logo-icon">P</span>
            <span>{store.brand}<small>CONCEPT STORE</small></span>
          </a>
          <nav className={`store-nav-links ${navOpen ? 'store-nav-open' : ''}`} aria-label={`${store.brand} navigation`}>
            <a href="#shop" onClick={() => setNavOpen(false)}>Shop</a>
            <a href="#story" onClick={() => setNavOpen(false)}>About this concept</a>
          </nav>
          <Button
            className="store-mobile-menu-button"
            variant="outline"
            size="icon"
            onClick={() => setNavOpen((open) => !open)}
            aria-label={navOpen ? 'Close shop navigation' : 'Open shop navigation'}
            aria-expanded={navOpen}
          >
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
          <Button
            className="store-cart-button"
            variant="outline"
            onClick={() => setCartOpen(true)}
            aria-label={`Open demo basket, ${cartCount} items`}
          >
            <ShoppingBag size={17} /> <span>Basket</span>
            <span className="cart-count">{cartCount}</span>
          </Button>
        </div>
      </header>

      <section className="store-hero" id="store-top">
        <div className="store-container store-hero-grid">
          <div className="store-hero-copy">
            <span className="store-eyebrow"><i /> {store.eyebrow}</span>
            <h1>{store.headline}</h1>
            <p>{store.intro}</p>
            <Button asChild className="store-hero-button">
              <a href="#shop">Explore the collection <ArrowRight size={16} /></a>
            </Button>
            <div className="store-hero-foot">
              <span>01 <i /> BROWSE</span><span>02 <i /> SELECT</span><span>03 <i /> DEMO ORDER</span>
            </div>
          </div>
          <div
            className="store-hero-art"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(0deg, rgba(36, 45, 30, .38), rgba(27, 43, 31, .12)), url("/images/paw-forest.webp")',
              backgroundSize: 'cover',
              backgroundPosition: 'center 54%',
            }}
          >
            <>
              <span className="hero-art-sun" />
              <Bone className="paw-hero-bone" size={24} strokeWidth={1.4} />
              <div className="hero-food-bag"><span>P&amp;P</span><i>✳</i><b>TRAIL<br />MIX</b><small>GOOD DOG FOOD</small></div>
            </>
            <span className="hero-art-index">CONCEPT / 001</span>
          </div>
        </div>
      </section>

      <section className="store-features">
        <div className="store-container feature-strip">
          <span><Check size={15} /> Product &amp; variant selection</span>
          <span><Check size={15} /> Working demo basket</span>
          <span><Check size={15} /> Backend-recorded demo orders</span>
          <span className="feature-no-pay">No live payments</span>
        </div>
      </section>

      <section className="shop-section" id="shop">
        <div className="store-container">
          <div className="shop-heading">
            <div>
              <p className="store-eyebrow">THE COLLECTION <i /></p>
              <h2>Find your <em>good thing.</em></h2>
            </div>
            <p className="shop-count">{products.length} sample products <span>·</span> Fictional catalog</p>
          </div>

          <div className="shop-toolbar">
            <div className="category-tabs" aria-label="Filter by category">
              {store.categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? 'category-tab active' : 'category-tab'}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="shop-controls">
              <label className="store-search">
                <Search size={15} />
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search"
                />
              </label>
              <label className="sort-select">
                <SlidersHorizontal size={14} />
                <span className="sr-only">Sort products</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
                <ChevronDown size={13} />
              </label>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product, index) => {
                const selectedVariantId =
                  selectedVariants[product.id] || product.variants[0].id
                const selectedVariant =
                  product.variants.find((variant) => variant.id === selectedVariantId) ??
                  product.variants[0]
                return (
                  <article className="product-card" key={product.id}>
                    <div className="product-image-wrap">
                      <span className="product-number">0{index + 1}</span>
                      <ProductArtwork product={product} storeId={store.id} />
                      <button
                        className="quick-add"
                        type="button"
                        aria-label={`Add ${product.name} to basket`}
                        onClick={() => addToCart(product, selectedVariant)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="product-info">
                      <div className="product-meta">
                        <span>{product.category}</span>
                        <span>{priceInEuros(selectedVariant.price)}</span>
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <label className="variant-select">
                        <span className="sr-only">Choose an option for {product.name}</span>
                        <select
                          value={selectedVariantId}
                          onChange={(event) => selectVariant(product.id, event.target.value)}
                        >
                          {product.variants.map((variant) => (
                            <option value={variant.id} key={variant.id}>
                              {variant.label} · {priceInEuros(variant.price)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} />
                      </label>
                      <Button
                        className="add-to-cart"
                        variant="secondary"
                        onClick={() => addToCart(product, selectedVariant)}
                      >
                        Add to basket <Plus size={15} />
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-products">
              <Search size={22} />
              <h3>No products match that search.</h3>
              <p>Try another word or choose a different category.</p>
              <button type="button" onClick={() => { setSearchTerm(''); setActiveCategory('All') }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="store-story" id="story">
        <div className="store-container story-inner">
          <div className="story-mark">P.</div>
          <div>
            <p className="store-eyebrow">A PORTFOLIO CONCEPT, NOT A REAL SHOP</p>
            <h2>Built to show the whole journey.</h2>
            <p>
              This fictional storefront demonstrates responsive product
              browsing, category and price filters, selectable variants, a
              basket and an order API. Product names, prices and business
              details are sample content. No payment is processed and no
              products are sold.
            </p>
          </div>
          <Link className="return-link" to="/">Back to Andrey&apos;s portfolio <ArrowRight size={15} /></Link>
        </div>
      </section>

      <footer className="store-footer">
        <div className="store-container store-footer-inner">
          <span>{store.brand} <small>FICTIONAL PORTFOLIO DEMO</small></span>
          <span>Concept website by <Link to="/">Andrey Lozov</Link></span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top ↑
          </button>
        </div>
      </footer>

      <Drawer.Root open={cartOpen} onOpenChange={setCartOpen} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="cart-drawer">
            <div className="drawer-handle" />
            <div className="drawer-header">
              <div>
                <Drawer.Title>Your basket <span>{cartCount}</span></Drawer.Title>
                <Drawer.Description>Sample items in this demo store</Drawer.Description>
              </div>
              <Drawer.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close basket"><X size={19} /></Button>
              </Drawer.Close>
            </div>

            {cartRows.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartRows.map(({ key, product, variant, quantity }) => (
                    <article className="cart-item" key={key}>
                      <ProductArtwork product={product} storeId={store.id} />
                      <div className="cart-item-copy">
                        <h3>{product.name}</h3>
                        <p>{variant.label}</p>
                        <strong>{priceInEuros(variant.price * quantity)}</strong>
                        <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                          <button type="button" onClick={() => changeQuantity(key, -1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                          <span>{quantity}</span>
                          <button type="button" onClick={() => changeQuantity(key, 1)} aria-label="Increase quantity"><Plus size={13} /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="cart-summary">
                  <div className="cart-total"><span>Sample subtotal</span><strong>{priceInEuros(cartTotal)}</strong></div>
                  <p>Shipping and taxes are not calculated in this concept demo.</p>
                </div>
                <form className="checkout-form" onSubmit={handleCheckout}>
                  <p className="checkout-label"><PackageCheck size={15} /> TRY THE DEMO ORDER FLOW</p>
                  <label>
                    <span>Name</span>
                    <input name="name" autoComplete="name" required maxLength={100} placeholder="Your name" />
                  </label>
                  <label>
                    <span>Email</span>
                    <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" />
                  </label>
                  <p className="checkout-disclaimer">
                    Submitting records a sample order to the demo backend. No
                    payment is taken, your contact details are not retained,
                    and this is not a real store.
                  </p>
                  <Button type="submit" className="checkout-submit" disabled={checkoutBusy}>
                    {checkoutBusy ? 'Recording…' : 'Place demo order'} <ArrowRight size={16} />
                  </Button>
                </form>
              </>
            ) : (
              <div className="empty-cart">
                <span><ShoppingBag size={23} /></span>
                <h3>Your basket is empty</h3>
                <p>Choose a sample product and its option to try out the basket.</p>
                <Drawer.Close asChild>
                  <Button variant="secondary">Continue exploring</Button>
                </Drawer.Close>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  )
}
