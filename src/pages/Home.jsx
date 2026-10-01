import ScrollScrubSpine from '../components/ScrollScrubSpine.jsx'
import BubblesOverlay from '../components/BubblesOverlay.jsx'
import HeroOasis from '../components/HeroOasis.jsx'
import Stations from '../components/Stations.jsx'
import Services from '../components/Services.jsx'
import RippleContact from '../components/RippleContact.jsx'

export default function Home() {
  return (
    <>
      <ScrollScrubSpine />
      <BubblesOverlay />
      <div className="relative z-10">
        <HeroOasis />
        <Stations />
        <Services />
        <RippleContact />
      </div>
    </>
  )
}
