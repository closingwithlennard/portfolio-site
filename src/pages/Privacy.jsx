const CONTACT_EMAIL = 'closingwithlennard@gmail.com'

// Static legal page, no motion. A titled block with a hairline rule above it,
// the same border-line/text-label tiers used across the rest of the site.
function Section({ title, children }) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="font-display text-label text-xl md:text-2xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4 text-label-2 text-base leading-relaxed">{children}</div>
    </section>
  )
}

export default function Privacy() {
  return (
    <div className="min-h-screen px-5 md:px-12 lg:px-24 pt-32 pb-32">
      <div className="max-w-2xl">
        <h1 className="font-display text-label text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight">
          Privacy policy
        </h1>
        <p className="mono-label text-label-3 mt-4">Last updated 2 September 2026</p>

        <p className="text-label-2 text-lg leading-relaxed mt-8">
          I build and run this site myself, under my own name, Lennard Capece. This page explains,
          in plain language, what happens to your data when you visit it, and how to reach me about
          it.
        </p>

        <div className="space-y-10 mt-12">
          <Section title="No cookies, no analytics, no tracking">
            <p>
              This site sets no cookies. It does not run any analytics tool, tracking script or
              advertising pixel, and there is no third party account attached to it that measures
              visits, clicks or behaviour.
            </p>
            <p>
              I do not know how many people read this page, which pages you looked at before it, or
              where you came from, and the site is built so that I never will.
            </p>
          </Section>

          <Section title="What data I collect">
            <p>
              Browsing this site does not create a profile of you anywhere. The only personal data
              that reaches me is what you choose to send me directly: if you email me, that message
              carries your address, your name if you give it, and whatever you write.
            </p>
            <p>
              This site's fonts are self-hosted, so loading a page never sends a request, or your IP
              address, to Google Fonts or any other third party font service.
            </p>
          </Section>

          <Section title="Hosting and server logs">
            <p>
              This site is hosted on Vercel. Like almost every web host, Vercel keeps standard server
              request logs: the requesting IP address, the time of the request, the page requested
              and the browser's user agent string.
            </p>
            <p>
              These are ordinary operational logs kept to run and secure the infrastructure. I have
              not added any analytics on top of them, and I do not use them to build a picture of who
              is visiting. Vercel runs a global network, so a request may be logged on infrastructure
              outside your own country. Vercel's own privacy policy covers exactly how long these
              logs are kept and how they are handled.
            </p>
          </Section>

          <Section title="Why I process it, and how long I keep it">
            <p>
              When you email me, I use that message to answer your question or talk through a
              project, which I rely on as a legitimate interest, and, where it applies, on the
              consent you give by writing to me in the first place.
            </p>
            <p>
              I keep that correspondence for as long as it is useful to that conversation, or any
              agreement that follows it, then for a reasonable period after that in case something
              related comes up. I do not sell, rent or trade your data, and I do not pass it to
              anyone for their own marketing. The only other party involved at all is Vercel, in its
              role as my hosting provider.
            </p>
          </Section>

          <Section title="Your rights under the GDPR">
            <p>
              If you are in the EU or the UK, the GDPR gives you a set of rights over any personal
              data I hold about you. You can ask me to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>give you access to the data I hold about you</li>
              <li>correct it if it is wrong or incomplete, that is rectification</li>
              <li>delete it, that is erasure</li>
              <li>give you a copy of it in a portable, machine readable format, that is portability</li>
              <li>stop processing it, that is objection</li>
            </ul>
            <p>
              Email me at the address below to use any of these. If you are not satisfied with how I
              respond, you also have the right to lodge a complaint with your local data protection
              supervisory authority.
            </p>
          </Section>

          <Section title="Your rights under Australian privacy law">
            <p>
              If you are in Australia, I aim to handle your data in line with the Australian Privacy
              Principles under the Privacy Act 1988 (Cth): I collect only what is described above, I
              use it only for the purpose you gave it to me, and I do not disclose it to anyone
              beyond my hosting provider.
            </p>
            <p>
              If you think I have handled your personal information incorrectly and my response has
              not resolved it, you can complain to the Office of the Australian Information
              Commissioner, the OAIC.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              I will update this page if the site itself changes in a way that affects your data,
              for example if I ever add real analytics. The date at the top always marks the most
              recent revision. If you keep using the site after a change, that means you accept the
              updated version.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For anything in this policy, including any of the rights listed above, email me
              directly.
            </p>
            <p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="cursor-pointer underline decoration-line underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
