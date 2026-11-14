import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  Menu as MenuIcon,
  Shell,
  Sparkles,
  Utensils,
  Wine,
  X,
} from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import './RestaurantDemo.css'

type Page = 'home' | 'menu' | 'story' | 'experiences' | 'reserve'
type MenuCategory = 'All' | 'To share' | 'From the sea' | 'Rice & fire'

type Dish = {
  name: string
  category: Exclude<MenuCategory, 'All'>
  description: string
  price: string
  image: string
  imageAlt: string
  detail: string
  note: string
}

const navigation: { page: Page; label: string }[] = [
  { page: 'home', label: 'Home' },
  { page: 'menu', label: 'Menu' },
  { page: 'story', label: 'Our story' },
  { page: 'experiences', label: 'Experiences' },
  { page: 'reserve', label: 'Reserve' },
]

const categories: MenuCategory[] = [
  'All',
  'To share',
  'From the sea',
  'Rice & fire',
]

const dishes: Dish[] = [
  {
    name: 'Catch of the day',
    category: 'From the sea',
    description: 'Market fish · citrus · seasonal greens',
    price: '€18',
    image: '/images/marea-fish.webp',
    imageAlt: 'Fresh fish and seafood presented on a plate.',
    detail:
      'A simple preparation that changes with the morning’s market. Ask the team about today’s catch and how it is being served.',
    note: 'Ask the team about allergens',
  },
  {
    name: 'Garlic prawns & lemon',
    category: 'From the sea',
    description: 'Garlic butter · smoked lemon · warm sourdough',
    price: '€24',
    image: '/images/marea-dish.webp',
    imageAlt: 'A refined seafood dish with fresh herbs.',
    detail:
      'Finished with garlic butter and smoked lemon, with warm sourdough for soaking up the last of the sauce.',
    note: 'Contains shellfish and dairy',
  },
  {
    name: 'Marea house paella',
    category: 'Rice & fire',
    description: 'Bomba rice · saffron · the day’s catch',
    price: '€29',
    image: '/images/marea-paella.webp',
    imageAlt: 'Golden seafood paella ready to share.',
    detail:
      'A generous pan of saffron-scented bomba rice, cooked slowly until the edges turn crisp. Prepared for two or more to share.',
    note: 'Contains shellfish; allow 35 minutes',
  },
  {
    name: 'Coastal market board',
    category: 'To share',
    description: 'A few seasonal plates · herbs · olive oil',
    price: '€16',
    image: '/images/marea-table.webp',
    imageAlt: 'A rustic table with several Mediterranean-style sharing plates.',
    detail:
      'A changing selection of small plates for the middle of the table, inspired by the market and the season.',
    note: 'Ask the team about ingredients',
  },
]

function pageFromPath(pathname: string): Page {
  const pageName = pathname.split('/').filter(Boolean).at(-1)
  if (pageName === 'menu' || pageName === 'story' || pageName === 'experiences' || pageName === 'reserve') {
    return pageName
  }
  return 'home'
}

function localDateString() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function RestaurantDemo() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isEmbedded = searchParams.get('embed') === '1'
  const activePage = pageFromPath(location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('All')
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [bookingComplete, setBookingComplete] = useState(false)

  const visibleDishes = useMemo(
    () =>
      activeCategory === 'All'
        ? dishes
        : dishes.filter((dish) => dish.category === activeCategory),
    [activeCategory],
  )

  function pagePath(page: Page) {
    const base = page === 'home' ? '/demo/marea' : `/demo/marea/${page}`
    return isEmbedded ? `${base}?embed=1` : base
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    if (!selectedDish) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedDish(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedDish])

  function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBookingComplete(true)
  }

  return (
    <main className="marea-site">
      {!isEmbedded && (
        <div className="marea-concept-bar">
          <span><Sparkles size={13} /> Fictional restaurant concept · sample menu · no real reservations</span>
          <Link to="/">Andrey Lozov portfolio <ArrowUpRight size={13} /></Link>
        </div>
      )}

      <header className="marea-header">
        <div className="marea-nav-wrap">
          <Link className="marea-wordmark" to={pagePath('home')} aria-label="Marea home">
            <span className="marea-wordmark-icon"><Shell size={20} strokeWidth={1.4} /></span>
            <span>marea<small>MAR · E · A / BY THE SEA</small></span>
          </Link>

          <nav className={`marea-nav ${menuOpen ? 'marea-nav-open' : ''}`} aria-label="Marea navigation">
            {navigation.map(({ page, label }) => (
              <Link
                key={page}
                to={pagePath(page)}
                aria-current={activePage === page ? 'page' : undefined}
                className={activePage === page ? 'marea-nav-active' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="marea-header-actions">
            <span className="marea-open-status"><i /> SAMPLE HOURS</span>
            <Button asChild className="marea-reserve-button">
              <Link to={pagePath('reserve')}>Find a table <ArrowUpRight size={15} /></Link>
            </Button>
            <button
              className="marea-menu-toggle"
              type="button"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {activePage === 'home' && (
        <>
          <section className="marea-hero">
            <img className="marea-hero-image" src="/images/marea-terrace.webp" alt="" fetchPriority="high" />
            <div className="marea-hero-scrim" />
            <div className="marea-hero-content">
              <p className="marea-kicker"><span /> A FICTIONAL COASTAL RESTAURANT / ALICANTE</p>
              <h1>Salt in the air.<br /><em>Time at the table.</em></h1>
              <p className="marea-hero-intro">
                A slow Mediterranean evening, shaped by the market, the sea and
                the people gathered around the table.
              </p>
              <div className="marea-hero-actions">
                <Button asChild className="marea-light-button">
                  <Link to={pagePath('menu')}>Explore the menu <ArrowRight size={16} /></Link>
                </Button>
                <Link className="marea-quiet-link" to={pagePath('story')}>A little about us <ArrowUpRight size={15} /></Link>
              </div>
              <div className="marea-hero-meta">
                <span><MapPin size={15} /> Alicante, Mediterranean coast</span>
                <span><Clock3 size={15} /> Tue – Sun · 13:00 till late</span>
              </div>
            </div>
            <div className="marea-hero-caption glass-card">
              <span>01 / 05</span>
              <i />
              <span>THE LONG WAY TO DINNER</span>
              <ArrowDown size={14} />
            </div>
            <span className="marea-vertical-note">MADE FOR THE HOURS BETWEEN SUNSET AND SUPPER</span>
          </section>

          <section className="marea-intro-section">
            <div className="marea-section-heading">
              <p className="marea-kicker"><span /> A PLACE TO SETTLE IN</p>
              <h2>Come for the coast.<br /><em>Stay for another plate.</em></h2>
            </div>
            <div className="marea-intro-copy">
              <p>
                Marea is an imagined seaside kitchen with a simple point of
                view: good things taste better when nobody is in a hurry.
                Follow the day’s catch, share something from the fire and leave
                a little room for one more glass.
              </p>
              <Link className="marea-inline-link" to={pagePath('story')}>Meet the idea <ArrowRight size={15} /></Link>
            </div>
          </section>

          <section className="marea-feature-section">
            <div className="marea-feature-image">
              <img src="/images/marea-paella.webp" alt="A golden seafood paella set out to share." loading="lazy" />
              <span className="marea-image-label glass-card">FROM THE FIRE / MADE TO SHARE</span>
            </div>
            <div className="marea-feature-copy">
              <p className="marea-kicker"><span /> THE MAREA TABLE</p>
              <h2>One more<br /><em>for the middle.</em></h2>
              <p>
                A pan arrives. Someone pours. The conversation takes the scenic
                route. Our sample menu is a small tribute to long lunches,
                coastal produce and food that brings people together.
              </p>
              <Link className="marea-outline-link" to={pagePath('menu')}>Take a look at the menu <ArrowRight size={16} /></Link>
            </div>
          </section>

          <section className="marea-moment-section">
            <div>
              <p className="marea-kicker"><span /> MAKE AN EVENING OF IT</p>
              <h2>The best plans<br /><em>leave room to linger.</em></h2>
            </div>
            <div className="marea-moment-card glass-card">
              <Wine size={23} />
              <span>THE MAREA EVENING</span>
              <p>A table by the water, a menu made for sharing, and nowhere else you need to be.</p>
              <Link to={pagePath('experiences')}>Explore the experiences <ArrowUpRight size={15} /></Link>
            </div>
          </section>
        </>
      )}

      {activePage === 'menu' && (
        <section className="marea-menu-page marea-page-shell">
          <div className="marea-page-hero marea-menu-page-hero">
            <img src="/images/marea-table.webp" alt="" />
            <div className="marea-page-hero-shade" />
            <div>
              <p className="marea-kicker"><span /> A SAMPLE OF THE MEDITERRANEAN</p>
              <h1>Made to<br /><em>pass around.</em></h1>
              <p>Sample dishes inspired by the coast, the market and a very long lunch.</p>
            </div>
            <span className="marea-page-index">02 / THE MENU</span>
          </div>
          <div className="marea-menu-content">
            <div className="marea-menu-heading">
              <div>
                <p className="marea-kicker"><span /> FICTIONAL SAMPLE MENU</p>
                <h2>Order for the table.</h2>
              </div>
              <p>Ingredients and prices are illustrative and may change with the catch.</p>
            </div>
            <div className="marea-filter-row" role="group" aria-label="Filter menu by category">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? 'marea-filter-active' : ''}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="marea-dish-grid">
              {visibleDishes.map((dish, index) => (
                <article className="marea-dish-card" key={dish.name}>
                  <button className="marea-dish-image" type="button" onClick={() => setSelectedDish(dish)} aria-label={`View ${dish.name} details`}>
                    <img src={dish.image} alt={dish.imageAlt} loading="lazy" />
                    <span className="marea-dish-number">0{index + 1}</span>
                    <span className="marea-dish-open"><ArrowUpRight size={17} /></span>
                  </button>
                  <div className="marea-dish-copy">
                    <div className="marea-dish-title"><h3>{dish.name}</h3><strong>{dish.price}</strong></div>
                    <p>{dish.description}</p>
                    <button type="button" onClick={() => setSelectedDish(dish)}>Dish details <ArrowRight size={13} /></button>
                  </div>
                </article>
              ))}
            </div>
            {visibleDishes.length === 0 && <p className="marea-empty-menu">There are no dishes in this category right now.</p>}
            <p className="marea-allergen-note"><Utensils size={15} /> Please tell your server about allergies. This fictional demo menu is illustrative only.</p>
          </div>
        </section>
      )}

      {activePage === 'story' && (
        <section className="marea-story-page marea-page-shell">
          <div className="marea-story-heading">
            <p className="marea-kicker"><span /> OUR IMAGINED LITTLE CORNER OF THE COAST</p>
            <h1>Rooted here.<br /><em>Always looking out.</em></h1>
            <p>
              Marea is a fictional restaurant concept built around the feeling
              of arriving at the sea with nowhere else to be.
            </p>
          </div>
          <div className="marea-story-grid">
            <figure className="marea-story-main-image">
              <img src="/images/marea-interior.webp" alt="Warm, relaxed dining room with a coastal restaurant atmosphere." />
              <figcaption className="glass-card">A ROOM FOR LONG LUNCHES / CONCEPT 01</figcaption>
            </figure>
            <div className="marea-story-note">
              <span className="marea-story-mark">M.</span>
              <p className="marea-kicker"><span /> A TABLE WITH A POINT OF VIEW</p>
              <h2>The sea is close.<br /><em>So is everyone.</em></h2>
              <p>
                The imagined kitchen follows a few uncomplicated ideas:
                seasonal ingredients, generous plates, less ceremony and more
                time around the table. The details are fictional, but the
                intention is real—make a place people want to return to.
              </p>
              <Link className="marea-inline-link" to={pagePath('menu')}>See what’s on the table <ArrowRight size={15} /></Link>
            </div>
            <figure className="marea-story-secondary-image">
              <img src="/images/marea-fish.webp" alt="Fresh fish prepared with herbs and seasonal ingredients." loading="lazy" />
              <figcaption>MARKET FIRST / EVERY DAY A LITTLE DIFFERENT</figcaption>
            </figure>
          </div>
          <div className="marea-values">
            <article><span>01</span><Shell size={19} /><h3>Follow the water</h3><p>A sample menu that puts the day’s catch and the coast in the foreground.</p></article>
            <article><span>02</span><Utensils size={19} /><h3>Share the good bits</h3><p>Generous dishes, easy company and a place for one more at the table.</p></article>
            <article><span>03</span><Sparkles size={19} /><h3>Leave room for later</h3><p>Thoughtful details, warm light and an evening that can take its time.</p></article>
          </div>
        </section>
      )}

      {activePage === 'experiences' && (
        <section className="marea-experiences-page marea-page-shell">
          <div className="marea-experience-intro">
            <p className="marea-kicker"><span /> MORE THAN A PLACE TO EAT</p>
            <h1>Good evenings<br /><em>have their own rhythm.</em></h1>
            <p>Three imagined ways to make a little more of your time by the coast.</p>
          </div>
          <div className="marea-experience-grid">
            <article className="marea-experience-card marea-experience-tall">
              <img src="/images/marea-table.webp" alt="A candlelit table ready for a long dinner." />
              <div className="marea-experience-overlay" />
              <div className="marea-experience-content">
                <span>01 / EVERY EVENING</span><h2>The long-table<br />dinner</h2>
                <p>A relaxed, share-style sample menu for a good-sized group.</p>
                <Link to={pagePath('reserve')}>Plan a table <ArrowUpRight size={15} /></Link>
              </div>
            </article>
            <article className="marea-experience-card">
              <img src="/images/marea-paella.webp" alt="Paella prepared for sharing." loading="lazy" />
              <div className="marea-experience-overlay" />
              <div className="marea-experience-content">
                <span>02 / WEEKENDS</span><h2>Rice by the sea</h2>
                <p>A shared pan, a little saffron and nowhere to rush off to.</p>
                <Link to={pagePath('menu')}>Browse sample dishes <ArrowUpRight size={15} /></Link>
              </div>
            </article>
            <article className="marea-experience-card">
              <img src="/images/marea-terrace.webp" alt="A sunny coastal terrace in the late afternoon." loading="lazy" />
              <div className="marea-experience-overlay" />
              <div className="marea-experience-content">
                <span>03 / GOLDEN HOUR</span><h2>A drink outside</h2>
                <p>Ease into the evening while the last light settles over the water.</p>
                <Link to={pagePath('reserve')}>Find a table <ArrowUpRight size={15} /></Link>
              </div>
            </article>
          </div>
        </section>
      )}

      {activePage === 'reserve' && (
        <section className="marea-reserve-page marea-page-shell">
          <div className="marea-reserve-aside">
            <p className="marea-kicker"><span /> THERE’S ROOM AT THE TABLE</p>
            <h1>Save a little<br /><em>space for us.</em></h1>
            <p>
              Pick a date and tell us who’s coming. This is a fictional
              portfolio demo: the form shows a sample confirmation but does
              not send a real reservation.
            </p>
            <div className="marea-visit-card glass-card">
              <span><MapPin size={16} /> OUR IMAGINED ADDRESS</span>
              <p>Paseo de la Explanada, Alicante<br />Spain · Fictional location</p>
              <span><Clock3 size={16} /> SAMPLE OPENING HOURS</span>
              <p>Tuesday – Sunday<br />13:00 – 23:00</p>
            </div>
            <img src="/images/marea-terrace.webp" alt="Sunlit terrace imagined for the Marea restaurant." loading="lazy" />
          </div>
          <div className="marea-reserve-form-wrap">
            {bookingComplete ? (
              <div className="marea-booking-success" role="status">
                <span><Check size={22} /></span>
                <p className="marea-kicker"><span /> SAMPLE REQUEST COMPLETE</p>
                <h2>Your table is<br /><em>imagined.</em></h2>
                <p>
                  Thanks for trying the demo. No reservation or personal
                  information was sent or stored.
                </p>
                <button type="button" onClick={() => setBookingComplete(false)}>Make another sample request <ArrowRight size={15} /></button>
              </div>
            ) : (
              <form className="marea-reserve-form" onSubmit={handleBooking}>
                <div className="marea-form-heading">
                  <span>01 / YOUR VISIT</span><span>FICTIONAL BOOKING FLOW</span>
                </div>
                <h2>Let’s make<br /><em>a plan.</em></h2>
                <label>
                  <span>Your name</span>
                  <input name="name" required autoComplete="name" maxLength={100} placeholder="Name for the table" />
                </label>
                <div className="marea-form-row">
                  <label>
                    <span>Email</span>
                    <input name="email" type="email" required autoComplete="email" maxLength={254} placeholder="you@example.com" />
                  </label>
                  <label>
                    <span>Guests</span>
                    <select name="guests" defaultValue="2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
                    </select>
                  </label>
                </div>
                <div className="marea-form-row">
                  <label>
                    <span>Date</span>
                    <input name="date" type="date" min={localDateString()} required />
                  </label>
                  <label>
                    <span>Time</span>
                    <select name="time" defaultValue="19:00">
                      {['13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00'].map((time) => <option key={time}>{time}</option>)}
                    </select>
                  </label>
                </div>
                <label>
                  <span>Anything we should know? <i>Optional</i></span>
                  <textarea name="notes" rows={3} maxLength={500} placeholder="A birthday, dietary note, or a table by the window…" />
                </label>
                <Button type="submit" className="marea-submit-button">Show sample confirmation <ArrowRight size={16} /></Button>
                <p className="marea-form-disclaimer">
                  Demo only. This does not contact a restaurant, send an email or create a real booking.
                </p>
              </form>
            )}
          </div>
        </section>
      )}

      <footer className="marea-footer">
        <div className="marea-footer-main">
          <Link className="marea-wordmark" to={pagePath('home')}>
            <span className="marea-wordmark-icon"><Shell size={20} strokeWidth={1.4} /></span>
            <span>marea<small>MAR · E · A / BY THE SEA</small></span>
          </Link>
          <p>Salt air, slow evenings, plates in the middle.</p>
          <div className="marea-footer-links">
            <Link to={pagePath('menu')}>Menu</Link>
            <Link to={pagePath('experiences')}>Experiences</Link>
            <Link to={pagePath('reserve')}>Reserve</Link>
          </div>
          <button className="marea-back-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="marea-footer-bottom">
          <span>Fictional restaurant concept / sample menu and location</span>
          {!isEmbedded && <Link to="/"><ArrowLeft size={13} /> Back to Andrey’s portfolio</Link>}
          <span>Designed for long evenings <Sparkles size={13} /></span>
        </div>
      </footer>

      {selectedDish && (
        <div className="marea-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedDish(null)
        }}>
          <section className="marea-dish-dialog" role="dialog" aria-modal="true" aria-labelledby="marea-dialog-title">
            <button className="marea-dialog-close" type="button" aria-label="Close dish details" onClick={() => setSelectedDish(null)}><X size={19} /></button>
            <img src={selectedDish.image} alt={selectedDish.imageAlt} />
            <div>
              <p className="marea-kicker"><span /> {selectedDish.category.toUpperCase()}</p>
              <h2 id="marea-dialog-title">{selectedDish.name}</h2>
              <strong>{selectedDish.price}</strong>
              <p>{selectedDish.detail}</p>
              <span className="marea-allergen-tag">{selectedDish.note}</span>
              <Link className="marea-inline-link" to={pagePath('reserve')} onClick={() => setSelectedDish(null)}>Plan a visit <ArrowRight size={15} /></Link>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
