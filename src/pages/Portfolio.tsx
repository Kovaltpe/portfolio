import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Languages,
  Mail,
  MapPin,
  Menu,
  Moon,
  MousePointer2,
  PanelsTopLeft,
  Send,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import './Portfolio.css'

const formspreeEndpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT?.trim()
const isContactFormConfigured = Boolean(
  formspreeEndpoint &&
  /^https:\/\/formspree\.io\/f\/[^/?#]+$/i.test(formspreeEndpoint) &&
  !formspreeEndpoint.endsWith('/your-form-id'),
)

const projects = [
  {
    id: 'paw-pantry',
    number: '01',
    kind: 'FICTIONAL E-COMMERCE CONCEPT',
    title: 'Paw & Pantry',
    description:
      'A warm, easy-to-browse dog-food shop concept with product variants, a working basket and a demo checkout flow.',
    route: '/demo/paw-pantry',
    previewRoute: '/demo/paw-pantry?embed=1',
    browserLabel: 'pawandpantry.demo',
    image: '/images/paw-forest.webp',
    imageAlt: 'Golden retriever outdoors, used as concept imagery for Paw & Pantry.',
    detailImages: [
      {
        src: '/images/paw-portrait.webp',
        alt: 'Golden retriever sitting outside.',
      },
      {
        src: '/images/paw-walk.webp',
        alt: 'Two dogs walking together at golden hour.',
      },
    ],
    tags: ['Product variants', 'Working demo basket', 'Responsive store'],
  },
  {
    id: 'marea',
    number: '02',
    kind: 'FICTIONAL RESTAURANT CONCEPT',
    title: 'Marea',
    description:
      'A coastal restaurant experience with a sample menu, several connected pages, dish details and an interactive reservation demo.',
    route: '/demo/marea',
    previewRoute: '/demo/marea?embed=1',
    browserLabel: 'marea.coast.demo',
    image: '/images/marea-terrace.webp',
    imageAlt: 'A sunlit terrace imagined for the fictional Marea restaurant.',
    detailImages: [
      {
        src: '/images/marea-interior.webp',
        alt: 'Warm coastal restaurant interior.',
      },
      {
        src: '/images/marea-paella.webp',
        alt: 'A seafood paella prepared for sharing.',
      },
    ],
    tags: ['Five connected pages', 'Interactive sample menu', 'Reservation demo'],
  },
]

const photos = [
  {
    src: '/images/paw-forest.webp',
    alt: 'Golden retriever standing in a sunlit field.',
    title: 'A little more outdoors',
    label: 'PAW & PANTRY · 01',
  },
  {
    src: '/images/paw-portrait.webp',
    alt: 'Golden retriever sitting in a garden.',
    title: 'Good days start here',
    label: 'PAW & PANTRY · 02',
  },
  {
    src: '/images/paw-walk.webp',
    alt: 'Two dogs walking together along a trail.',
    title: 'Room to roam',
    label: 'PAW & PANTRY · 03',
  },
  {
      src: '/images/marea-terrace.webp',
      alt: 'Sunlit coastal terrace with tables set for lunch.',
      title: 'An afternoon by the water',
    label: 'MAREA · 01',
  },
  {
      src: '/images/marea-interior.webp',
      alt: 'Warm restaurant interior with coastal styling.',
      title: 'A room made for lingering',
    label: 'MAREA · 02',
  },
  {
      src: '/images/marea-paella.webp',
      alt: 'Seafood paella with a golden saffron finish.',
      title: 'One more for the middle',
    label: 'MAREA · 03',
  },
  {
      src: '/images/marea-fish.webp',
      alt: 'Fresh fish served with seasonal ingredients.',
    title: 'Follow the day’s catch',
    label: 'MAREA · 04',
  },
  {
    src: '/images/marea-dish.webp',
    alt: 'A carefully plated seafood dish.',
    title: 'A little something from the sea',
    label: 'MAREA · 05',
  },
  {
    src: '/images/marea-table.webp',
    alt: 'A candlelit coastal table ready for dinner.',
    title: 'The long way to dinner',
    label: 'MAREA · 06',
  },
]

const services = [
  {
    number: '01',
    title: 'Frontend development',
    description:
      'Responsive, accessible interfaces that make the next step clear on every screen.',
    icon: PanelsTopLeft,
  },
  {
    number: '02',
    title: 'Backend development',
    description:
      'APIs, data flows, forms and the practical logic that makes a website work.',
    icon: Code2,
  },
  {
    number: '03',
    title: 'Business websites & shops',
    description:
      'A connected web presence shaped around what your business needs to do.',
    icon: Sparkles,
  },
]

const processSteps = [
  {
    number: '01',
    title: 'Understand',
    description: 'Clarify the audience, the offer and what visitors need to do.',
  },
  {
    number: '02',
    title: 'Shape',
    description: 'Plan the pages, visual direction and most important interactions.',
  },
  {
    number: '03',
    title: 'Build',
    description: 'Connect the interface to the data and functionality behind it.',
  },
  {
    number: '04',
    title: 'Refine',
    description: 'Check the details across screen sizes and make the experience feel complete.',
  },
]

const copyrightYear = new Date().getFullYear()

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  try {
    return window.localStorage.getItem('andrey-theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function PhotoRail() {
  const railRef = useRef<HTMLDivElement>(null)
  const [activePhoto, setActivePhoto] = useState(0)

  function syncActivePhoto() {
    const rail = railRef.current
    if (!rail) return

    const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-photo-card]'))
    if (!cards.length) return

    const railStart = rail.getBoundingClientRect().left
    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railStart)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    setActivePhoto((current) => (current === closestIndex ? current : closestIndex))
  }

  function goToPhoto(index: number) {
    const rail = railRef.current
    const card = rail?.querySelectorAll<HTMLElement>('[data-photo-card]')[index]
    if (!card) return

    card.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  function handleRailKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goToPhoto(Math.min(activePhoto + 1, photos.length - 1))
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goToPhoto(Math.max(activePhoto - 1, 0))
    }
  }

  return (
    <section className="studio-photo-section" aria-labelledby="photo-heading" data-reveal>
      <div className="studio-container">
        <div className="studio-section-top photo-section-top">
          <div>
            <p className="studio-kicker"><span /> DETAILS / {String(photos.length).padStart(2, '0')} FRAMES</p>
            <h2 id="photo-heading">
              Let the work
              <br />
              <em>speak in pictures.</em>
            </h2>
          </div>
          <div className="photo-controls glass-surface">
            <span className="photo-count" aria-live="polite">
              {String(activePhoto + 1).padStart(2, '0')}
              <span> / {String(photos.length).padStart(2, '0')}</span>
            </span>
            <button
              className="glass-icon-button"
              type="button"
              onClick={() => goToPhoto(Math.max(activePhoto - 1, 0))}
              disabled={activePhoto === 0}
              aria-label="Show previous image"
            >
              <ArrowLeft size={17} />
            </button>
            <button
              className="glass-icon-button"
              type="button"
              onClick={() => goToPhoto(Math.min(activePhoto + 1, photos.length - 1))}
              disabled={activePhoto === photos.length - 1}
              aria-label="Show next image"
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="photo-rail"
        ref={railRef}
        role="region"
        aria-label="Project image gallery. Scroll horizontally or use the arrow keys."
        tabIndex={0}
        onKeyDown={handleRailKeyDown}
        onScroll={syncActivePhoto}
      >
        {photos.map((photo, index) => (
          <figure
            className={`photo-card ${index === activePhoto ? 'photo-card-active' : ''}`}
            data-photo-card
            key={photo.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${photos.length}: ${photo.title}`}
          >
            <img src={photo.src} alt={photo.alt} loading="lazy" />
            <figcaption className="photo-caption glass-surface">
              <span>{photo.label}</span>
              <strong>{photo.title}</strong>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="studio-container photo-rail-hint">
        <span><MousePointer2 size={15} /> Drag, swipe or use the arrows</span>
        <div className="photo-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${(activePhoto + 1) / photos.length})` }} />
        </div>
      </div>
    </section>
  )
}

export function Portfolio() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeProject, setActiveProject] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactStatus, setContactStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const showcaseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f6f3eb' : '#111211')
  }, [theme])

  useEffect(() => {
    const page = document.querySelector('.studio-page')
    if (!page) return

    if (!('IntersectionObserver' in window)) {
      page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
        element.classList.add('is-visible')
      })
      return
    }

    page.classList.add('with-reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
    )

    page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let frame = 0

    function updateProgress() {
      frame = 0
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0)
    }

    function scheduleProgressUpdate() {
      if (frame) return
      frame = window.requestAnimationFrame(updateProgress)
    }

    scheduleProgressUpdate()
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    window.addEventListener('resize', scheduleProgressUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleProgressUpdate)
      window.removeEventListener('resize', scheduleProgressUpdate)
    }
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', nextTheme === 'light' ? '#f6f3eb' : '#111211')
    try {
      window.localStorage.setItem('andrey-theme', nextTheme)
    } catch {
      // Keep the selected theme for this view when browser storage is unavailable.
    }
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  function syncActiveProject() {
    const track = showcaseRef.current
    if (!track) return

    const slides = Array.from(
      track.querySelectorAll<HTMLElement>('[data-showcase-slide]'),
    )
    if (!slides.length) return

    const trackLeft = track.getBoundingClientRect().left
    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - trackLeft)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    setActiveProject((current) => (current === closestIndex ? current : closestIndex))
  }

  function goToProject(index: number) {
    const track = showcaseRef.current
    const slide = track?.querySelectorAll<HTMLElement>('[data-showcase-slide]')[index]
    if (!slide) return

    slide.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'start',
    })
  }

  function handleShowcaseKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goToProject(Math.min(activeProject + 1, projects.length - 1))
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goToProject(Math.max(activeProject - 1, 0))
    }
  }

  async function handleContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!isContactFormConfigured || !formspreeEndpoint) {
      setContactStatus({
        kind: 'error',
        message: 'Email delivery is not configured yet. Add your Formspree form endpoint as VITE_FORMSPREE_ENDPOINT to enable sending.',
      })
      return
    }

    setContactSubmitting(true)
    setContactStatus(null)
    try {
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      const result = (await response.json().catch(() => ({}))) as {
        errors?: { message?: string }[]
      }
      if (!response.ok) {
        throw new Error(result.errors?.[0]?.message || 'The message could not be delivered. Please try again.')
      }
      form.reset()
      setContactStatus({ kind: 'success', message: 'Thanks — your project inquiry was sent to the configured inbox.' })
      toast.success('Your project inquiry was sent.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The message could not be delivered. Please try again.'
      setContactStatus({ kind: 'error', message })
      toast.error(message)
    } finally {
      setContactSubmitting(false)
    }
  }

  return (
    <div className="studio-page">
      <a className="studio-skip-link" href="#main">
        Skip to content
      </a>

      <div className="studio-scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>

      <header className="studio-header">
        <div className="studio-nav glass-surface">
          <a className="studio-wordmark" href="#top" onClick={closeMenu}>
            <span className="studio-mark">A.</span>
            <span>Andrey Lozov</span>
          </a>

          <nav
            className={`studio-nav-links ${menuOpen ? 'studio-nav-open' : ''}`}
            aria-label="Main navigation"
          >
            <a href="#work" onClick={closeMenu}>Work</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <Link to="/resume" onClick={closeMenu}>Resume</Link>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </nav>

          <div className="studio-nav-actions">
            <Button
              variant="outline"
              size="icon"
              className="glass-icon-button theme-toggle-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <Button asChild className="studio-nav-cta">
              <a href="#contact">Let&apos;s talk <ArrowUpRight size={15} /></a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="glass-icon-button studio-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </Button>
          </div>
        </div>
      </header>

      <main className="studio-main" id="main">
        <section className="studio-hero" id="top">
          <div className="studio-container studio-hero-grid">
            <div className="studio-hero-copy" data-reveal>
              <div className="studio-availability glass-surface">
                <span className="availability-pulse" />
                Available for freelance projects
              </div>
              <p className="studio-kicker">FRONTEND + BACKEND / ALICANTE, SPAIN</p>
              <h1>
                A sharper way
                <br />
                to show up
                <br />
                <em>online.</em>
              </h1>
              <p className="studio-hero-description">
                I build thoughtful websites for companies — from the first
                impression to the systems working behind the scenes.
              </p>
              <div className="studio-hero-actions">
                <Button asChild className="studio-primary-button">
                  <a href="#contact">Let&apos;s build something <ArrowUpRight size={17} /></a>
                </Button>
                <a className="studio-text-link" href="#work">
                  Scroll into the work <ArrowDown size={15} />
                </a>
              </div>
              <div className="studio-hero-meta">
                <span><MapPin size={15} /> Alicante, Spain</span>
                <span><Languages size={15} /> RU · ES · EN · UA</span>
              </div>
            </div>

            <div className="studio-hero-collage" data-reveal>
              <figure className="hero-photo hero-photo-main">
                <img
                  src="/images/paw-forest.webp"
                  alt="Golden retriever standing in a sunlit field."
                  fetchPriority="high"
                />
                <figcaption>PAW &amp; PANTRY / CONCEPT 01</figcaption>
              </figure>
              <figure className="hero-photo hero-photo-audio">
                <img
                  src="/images/marea-terrace.webp"
                  alt="A sunlit terrace imagined for the Marea restaurant concept."
                  fetchPriority="high"
                />
                <figcaption>MAREA / CONCEPT 02</figcaption>
              </figure>
              <figure className="hero-photo hero-photo-walk">
                <img
                  src="/images/paw-walk.webp"
                  alt="Two dogs walking together on a trail."
                  loading="lazy"
                />
              </figure>
              <div className="hero-glass-note glass-surface">
                <span className="hero-note-icon"><Sparkles size={17} /></span>
                <span><strong>Designed to be explored</strong><small>Two interactive website concepts</small></span>
                <ArrowUpRight size={16} />
              </div>
              <div className="hero-collage-index">01—02 <span>SELECTED CONCEPTS</span></div>
            </div>
          </div>

          <div className="studio-container studio-hero-bottom">
            <span className="hero-bottom-note">INDEPENDENT · FREELANCE</span>
            <div className="hero-tech-list" aria-label="Technologies">
              <span>React</span><span>TypeScript</span><span>Tailwind CSS</span><span>Cloudflare</span>
            </div>
            <a href="#work">Explore <ArrowDown size={14} /></a>
          </div>
        </section>

        <section className="studio-intro-band" aria-label="How I build websites">
          <div className="studio-container intro-band-inner">
            <span>GOOD DESIGN</span><i />
            <span>USEFUL INTERACTIONS</span><i />
            <span>FRONTEND + BACKEND</span><i />
            <span>MADE FOR REAL PEOPLE</span>
          </div>
        </section>

        <section className="studio-work-section" id="work" aria-labelledby="work-heading">
          <div className="studio-container studio-section-top work-section-top" data-reveal>
            <div>
              <p className="studio-kicker"><span /> 01 / SELECTED CONCEPTS</p>
              <h2 id="work-heading">
                Don&apos;t just look.
                <br />
                <em>Take them for a scroll.</em>
              </h2>
              <p className="studio-section-description">
                These fictional concepts show more than a landing page. Scroll
                inside each mini-site, explore its interactions, then open it full size.
              </p>
            </div>
            <div className="showcase-controls glass-surface">
              <span className="showcase-count" aria-live="polite">
                {String(activeProject + 1).padStart(2, '0')}
                <span> / {String(projects.length).padStart(2, '0')}</span>
              </span>
              <button
                className="glass-icon-button"
                type="button"
                onClick={() => goToProject(Math.max(activeProject - 1, 0))}
                disabled={activeProject === 0}
                aria-label="Previous mini-site"
              >
                <ArrowLeft size={17} />
              </button>
              <button
                className="glass-icon-button"
                type="button"
                onClick={() => goToProject(Math.min(activeProject + 1, projects.length - 1))}
                disabled={activeProject === projects.length - 1}
                aria-label="Next mini-site"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <div
            className="showcase-track"
            ref={showcaseRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Interactive mini-site previews"
            tabIndex={0}
            onScroll={syncActiveProject}
            onKeyDown={handleShowcaseKeyDown}
          >
            {projects.map((project, index) => (
              <article
                className={`showcase-slide showcase-${project.id}`}
                data-showcase-slide
                data-reveal
                key={project.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${projects.length}: ${project.title}`}
              >
                <div className="showcase-copy">
                  <p className="showcase-label">{project.number} / {project.kind}</p>
                  <h3>{project.title}</h3>
                  <p className="showcase-description">{project.description}</p>
                  <div className="showcase-tags">
                    {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="showcase-photo-pair">
                    {project.detailImages.map((image) => (
                      <img src={image.src} alt={image.alt} loading="lazy" key={image.src} />
                    ))}
                  </div>
                  <Link className="showcase-open-link" to={project.route}>
                    Open the full demo <ArrowUpRight size={16} />
                  </Link>
                  <span className="showcase-small-note">
                    {project.id === 'paw-pantry'
                      ? 'Fictional shop · Sample products · No real payments'
                      : 'Fictional restaurant · Sample menu · No real bookings'}
                  </span>
                </div>

                <div className="mini-site-shell">
                  <div className="mini-site-toolbar">
                    <span className="browser-lights" aria-hidden="true"><i /><i /><i /></span>
                    <span className="mini-site-address"><PanelsTopLeft size={13} /> {project.browserLabel}</span>
                    <span className="mini-site-scroll-label"><MousePointer2 size={13} /> SCROLL INSIDE</span>
                  </div>
                  <iframe
                    className="mini-site-iframe"
                  src={project.previewRoute}
                    title={`${project.title} interactive mini-site. Scroll inside to explore its pages and demo interactions.`}
                    aria-describedby={`mini-site-hint-${project.id}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    referrerPolicy="same-origin"
                  />
                  <div className="mini-site-hint glass-surface" id={`mini-site-hint-${project.id}`}>
                    <span><ArrowDown size={13} /> Browse this mini-site inside the frame</span>
                    <Link to={project.route}>Open full screen <ArrowUpRight size={13} /></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="studio-container showcase-bottom">
            <span><MousePointer2 size={15} /> Swipe, trackpad, keyboard arrows or the buttons</span>
            <div className="showcase-dots" aria-label="Choose mini-site preview">
              {projects.map((project, index) => (
                <button
                  type="button"
                  key={project.id}
                  className={index === activeProject ? 'showcase-dot active' : 'showcase-dot'}
                  onClick={() => goToProject(index)}
                  aria-label={`Show ${project.title}`}
                  aria-current={index === activeProject ? 'true' : undefined}
                />
              ))}
            </div>
            <span>{String(projects.length).padStart(2, '0')} MINI-SITES</span>
          </div>
        </section>

        <PhotoRail />

        <section className="studio-services-section" id="services" aria-labelledby="services-heading">
          <div className="studio-container">
            <div className="studio-section-top services-section-top" data-reveal>
              <div>
                <p className="studio-kicker"><span /> 02 / WHAT I CAN BUILD</p>
                <h2 id="services-heading">
                  The whole thing,
                  <br />
                  <em>working together.</em>
                </h2>
              </div>
              <p className="studio-section-description">
                A good website is more than a pretty screen. The interface,
                content and the system behind it should feel like one product.
              </p>
            </div>

            <div className="studio-service-grid">
              {services.map(({ number, title, description, icon: Icon }) => (
                <article className="studio-service-card glass-surface" key={number} data-reveal>
                  <div className="service-card-top">
                    <span>{number}</span>
                    <Icon size={21} strokeWidth={1.6} />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="service-card-arrow"><ArrowUpRight size={17} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="studio-process-section" aria-labelledby="process-heading" data-reveal>
          <div className="studio-container process-layout">
            <div className="process-intro">
              <p className="studio-kicker"><span /> 03 / A CLEAR PROCESS</p>
              <h2 id="process-heading">
                From first
                <br />
                thought to
                <br />
                <em>live website.</em>
              </h2>
              <p>
                A simple way to keep the work focused, the decisions clear and
                the final experience connected.
              </p>
            </div>
            <div className="process-list">
              {processSteps.map((step) => (
                <article className="process-step" key={step.number}>
                  <span className="process-number">{step.number}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                  <Check size={16} aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="studio-about-section" id="about" aria-labelledby="about-heading">
          <div className="studio-container about-layout">
            <div className="about-image-card" data-reveal>
              <img
                src="/images/paw-portrait.webp"
                alt="A golden retriever sitting outdoors in soft afternoon light."
                loading="lazy"
              />
              <div className="about-image-caption glass-surface">
                <span>ALICANTE, SPAIN</span>
                <MapPin size={16} />
              </div>
              <span className="about-image-index">A / 01</span>
            </div>
            <div className="about-copy" data-reveal>
              <p className="studio-kicker"><span /> 04 / A LITTLE ABOUT ME</p>
              <h2 id="about-heading">
                People first.
                <br />
                <em>Technology second.</em>
              </h2>
              <p className="about-lead">
                I&apos;m Andrey, a freelance frontend and backend developer
                based in Alicante, Spain.
              </p>
              <p>
                I work with companies to create useful websites that make sense
                for the people visiting them and the business behind them. I
                care about clear communication, thoughtful details and making
                every part of the experience feel connected.
              </p>
              <div className="about-languages">
                <span>LANGUAGES</span>
                <div><i>Russian</i><i>Spanish</i><i>English</i><i>Ukrainian</i></div>
              </div>
              <div className="about-note glass-surface">
                <Sparkles size={17} />
                <span>Open to freelance website projects for companies.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="studio-contact-section" id="contact" aria-labelledby="contact-heading">
          <div className="studio-contact-orb" aria-hidden="true" />
          <div className="studio-container studio-contact-layout">
            <div className="contact-copy" data-reveal>
              <p className="studio-kicker"><span /> 05 / HAVE A PROJECT IN MIND?</p>
              <h2 id="contact-heading">
                Let&apos;s make
                <br />
                something
                <br />
                <em>that matters.</em>
              </h2>
              <p className="contact-intro">
                Tell me what you&apos;re working on. We can figure out the right
                next step together.
              </p>
              <a className="contact-email glass-surface" href="mailto:kovlozrr@gmail.com">
                <Mail size={17} /> kovlozrr@gmail.com <ArrowUpRight size={16} />
              </a>
              <div className="contact-social-links">
                <a href="https://t.me/kovaltpee" target="_blank" rel="noreferrer">
                  Telegram <ArrowUpRight size={13} />
                </a>
                <a href="https://wa.me/34627316586" target="_blank" rel="noreferrer">
                  WhatsApp <ArrowUpRight size={13} />
                </a>
              </div>
            </div>

            <form className="studio-contact-form glass-surface" onSubmit={handleContact} data-reveal>
              <div className="contact-form-heading">
                <span>LET&apos;S START WITH A NOTE</span>
                <Send size={17} />
              </div>
              <input type="hidden" name="_subject" value="Website project inquiry from Andrey Lozov’s portfolio" />
              <label>
                <span>Your name</span>
                <input name="name" autoComplete="name" required maxLength={100} placeholder="How should I call you?" />
              </label>
              <label>
                <span>Email address</span>
                <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" />
              </label>
              <label>
                <span>Tell me about your project</span>
                <textarea name="message" required minLength={10} maxLength={3000} rows={4} placeholder="What would you like to build?" />
              </label>
              {contactStatus && (
                <p className={`contact-form-status ${contactStatus.kind}`} role={contactStatus.kind === 'error' ? 'alert' : 'status'}>
                  {contactStatus.message}
                </p>
              )}
              <Button type="submit" className="studio-primary-button form-submit-button" disabled={contactSubmitting}>
                {contactSubmitting ? 'Sending…' : 'Send project inquiry'} <ArrowUpRight size={16} />
              </Button>
              <p className="form-note">
                {isContactFormConfigured
                  ? 'Your message is sent to the inbox configured for this Formspree form.'
                  : 'Email delivery is not connected yet. Use the email link if you need to reach me now.'}
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="studio-footer">
        <div className="studio-container footer-main">
          <a className="studio-wordmark" href="#top">
            <span className="studio-mark">A.</span>
            <span>Andrey Lozov</span>
          </a>
          <span>Freelance frontend + backend developer · Alicante, Spain</span>
          <a className="footer-top-link" href="#top">Back to top <ArrowUpRight size={15} /></a>
        </div>
        <div className="studio-container footer-bottom">
          <span>© {copyrightYear} Andrey Lozov</span>
          <span>React · TypeScript · Tailwind CSS</span>
          <span>Built with care <Sparkles size={13} /></span>
        </div>
      </footer>
    </div>
  )
}
