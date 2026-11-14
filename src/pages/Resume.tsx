import { ArrowLeft, ArrowUpRight, Languages, MapPin, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

const contactLinks = [
  { label: 'Email', text: 'kovlozrr@gmail.com', href: 'mailto:kovlozrr@gmail.com' },
  { label: 'Telegram', text: '@kovaltpee', href: 'https://t.me/kovaltpee' },
  { label: 'WhatsApp', text: '+34 627 316 586', href: 'https://wa.me/34627316586' },
]

export function Resume() {
  return (
    <main className="resume-page">
      <div className="resume-toolbar">
        <Link to="/" className="resume-back"><ArrowLeft size={15} /> Back to portfolio</Link>
        <Button onClick={() => window.print()}><Printer size={15} /> Print / Save as PDF</Button>
      </div>

      <article className="resume-sheet">
        <header className="resume-header">
          <div>
            <p className="resume-kicker">CURRICULUM VITAE</p>
            <h1>Andrey Lozov</h1>
            <p className="resume-title">Freelance Frontend &amp; Backend Developer</p>
          </div>
          <span className="resume-monogram">AL</span>
        </header>

        <div className="resume-contact">
          {contactLinks.map((contact) => (
            <a key={contact.label} href={contact.href} target={contact.label === 'Email' ? undefined : '_blank'} rel={contact.label === 'Email' ? undefined : 'noreferrer'}>
              <span>{contact.label}</span>{contact.text}<ArrowUpRight size={11} />
            </a>
          ))}
          <span><MapPin size={13} /> Alicante, Spain</span>
        </div>

        <div className="resume-columns">
          <div className="resume-main-column">
            <section className="resume-block">
              <h2>Profile</h2>
              <p>
                Freelance frontend and backend developer based in Alicante,
                Spain. Available to work with companies on website development,
                from customer-facing interfaces to the backend functionality
                behind them.
              </p>
            </section>

            <section className="resume-block">
              <h2>Experience</h2>
              <div className="resume-entry">
                <div className="resume-entry-heading">
                  <h3>Freelance Website Development</h3>
                  <span>Independent</span>
                </div>
                <p>
                  Frontend and backend website development for companies,
                  covering customer-facing pages and the functionality behind
                  them.
                </p>
              </div>
            </section>

            <section className="resume-block">
              <h2>Selected Portfolio Concepts</h2>
              <div className="resume-entry">
                <div className="resume-entry-heading">
                  <h3>Paw &amp; Pantry</h3><span>Fictional concept</span>
                </div>
                <p>
                  Dog-food shop demo with selectable product variants, a basket
                  and backend-recorded sample orders. No real products or sales.
                </p>
              </div>
              <div className="resume-entry">
                <div className="resume-entry-heading">
                  <h3>Marea</h3><span>Fictional concept</span>
                </div>
                <p>
                  Coastal restaurant concept with connected pages, an
                  interactive sample menu, dish details and a simulated
                  reservation flow; no real bookings are created.
                </p>
              </div>
            </section>
          </div>

          <aside className="resume-side-column">
            <section className="resume-block">
              <h2>Skills</h2>
              <ul className="resume-skills">
                <li>Frontend development</li>
                <li>Backend development</li>
                <li>Website creation</li>
              </ul>
            </section>
            <section className="resume-block">
              <h2><Languages size={14} /> Languages</h2>
              <ul className="resume-languages">
                <li>Russian</li>
                <li>Spanish</li>
                <li>English</li>
                <li>Ukrainian</li>
              </ul>
            </section>
          </aside>
        </div>

        <footer className="resume-footer">
          <span>Prepared from information provided by Andrey Lozov.</span>
          <span>Fictional demo projects are identified as concepts.</span>
        </footer>
      </article>
    </main>
  )
}
