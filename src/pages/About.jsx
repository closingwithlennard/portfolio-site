import MagneticButton from '../components/MagneticButton.jsx'

// First person throughout. No "we", no team, no agency framing.
// Every concrete claim here must be backed by an artifact on /work.

function Block({ label, children }) {
  return (
    <section className="border-t border-line py-12 md:grid md:grid-cols-12 md:gap-8">
      <h2 className="mono-label mb-4 text-label-3 md:col-span-3 md:mb-0">{label}</h2>
      <div className="space-y-4 text-label-2 md:col-span-9 md:max-w-2xl">{children}</div>
    </section>
  )
}

export default function About() {
  return (
    <div className="px-5 pt-32 pb-24 md:px-12 lg:px-24">
      <h1 className="max-w-4xl font-display text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[1] tracking-tight text-label">
        I work across the whole stack,
        <br />
        including the part that looks good.
      </h1>

      <p className="mono-label mt-8 text-label-3">Remote / currently Southeast Asia / GMT+7</p>

      <div className="mt-20">
        <Block label="What I do">
          <p>
            I build autonomous agent systems, data pipelines and 3D web interfaces. Most of
            my work starts as a problem nobody has tooling for yet, and ends as something
            that runs on a schedule without me watching it.
          </p>
          <p>
            I am one person, not a studio. That means you talk to whoever writes the code,
            and there is no account manager in between.
          </p>
        </Block>

        <Block label="How I work">
          <p>
            I write tests before I trust anything, and I keep a record of the decisions that
            shaped a system so the next person can read why, not just what.
          </p>
          <p>
            I would rather tell you a number is unverified than round it up. Everything on
            the work page is backed by something you can open.
          </p>
        </Block>

        <Block label="Where I am">
          <p>
            I work fully remote, currently from Southeast Asia (GMT+7), and I am fluent in
            German, English and Spanish. My mornings overlap with the European working day,
            and the rest of the gap tends to help: work lands while you sleep.
          </p>
        </Block>
      </div>

      <div className="mt-16 flex flex-wrap gap-4 border-t border-line pt-12">
        <MagneticButton href="/#work" variant="primary">See the work</MagneticButton>
        <MagneticButton href="/#contact" variant="ghost">Get in touch</MagneticButton>
      </div>
    </div>
  )
}
