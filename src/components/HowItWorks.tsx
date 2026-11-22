export default function HowItWorks() {
  return (
    <details className="card methods">
      <summary>Hoe werkt het?</summary>
      <div className="details-body">
        <p>
          Alleen bedoeld voor volwassenen (18+). Geen medisch hulpmiddel, alcoholtester of rijgeschiktheidstest. Geen
          bekende nulmeting: het model neemt vóór je eerste gelogde drankje 0‰ aan, ook als je in werkelijkheid nog
          alcohol in je bloed hebt.
        </p>
        <p>
          Pure alcohol (g) = volume (ml) × alcoholpercentage / 100 × 0,789. Het lichaamswater wordt met de Hume–Weyers-formules
          (1966) geschat uit lengte (cm), gewicht (kg) en de gekozen fysiologische formule:
        </p>
        <ul>
          <li>Mannelijk: 0,194786 × lengte + 0,296785 × gewicht − 14,012934 liter.</li>
          <li>Vrouwelijk: 0,34454 × lengte + 0,183809 × gewicht − 35,270121 liter.</li>
        </ul>
        <p>
          De theoretische bijdrage is 0,8 × gram alcohol / liter lichaamswater, weergegeven als benadering in ‰. Elk
          drankje wordt gelijkmatig over 45 minuten opgenomen vanaf de ingevoerde starttijd; het model rekent met een
          vaste afbraak van 0,15‰ per uur en gaat nooit onder nul. Deze aannames zijn sterk vereenvoudigd.
        </p>
        <p>
          Voeding, drinktempo, medicatie, gezondheid en individuele verschillen zijn niet meegenomen. Opname kan veel
          langer duren; afbraak kan trager zijn. Een uitkomst van 0,00‰ bewijst niet dat je nuchter bent. De gekozen
          formule is geen uitspraak over genderidentiteit.
        </p>
        <p>
          De rode stippellijn toont de geselecteerde Nederlandse wettelijke referentie: doorgaans 0,5‰ voor ervaren en
          0,2‰ voor beginnende bestuurders. Bekijk de{" "}
          <a
            href="https://www.rijksoverheid.nl/onderwerpen/verkeersveiligheid/vraag-en-antwoord/met-hoeveel-alcohol-mag-ik-deelnemen-aan-het-verkeer"
            target="_blank"
            rel="noopener noreferrer"
          >
            informatie van de Rijksoverheid
          </a>{" "}
          voor de regels die voor jou gelden.
        </p>
        <h3>Bewaren, camera en iOS</h3>
        <p>
          Profiel en logboek blijven in de lokale browseropslag op dit apparaat staan, ook na herladen. Tijd wordt uit
          absolute tijdstempels berekend, niet uit een aftellende teller. Privémodus, wissen van websitegegevens of
          opslagbeheer van iOS kunnen gegevens verwijderen. Exporteer als back-up.
        </p>
        <p>
          Open deze pagina via HTTPS in Safari. Gebruik eventueel Deel → Zet op beginscherm. iOS kan een pagina altijd
          pauzeren of afsluiten; een actieve wake lock is geen garantie. Bij terugkeer wordt het verloop opnieuw
          berekend. Laat de app voor offline gebruik open: dit losse HTML-bestand biedt geen gegarandeerde offline
          herstart.
        </p>
        <p>
          Fotoherkenning gebruikt een beeldmodel via Cloudflare Workers AI. Alleen na jouw toestemming wordt een
          verkleinde JPEG-foto naar de ingestelde scanner gestuurd; lengte, gewicht en logboek worden niet meegestuurd.
          Het opnieuw tekenen van de foto verwijdert bestandsmetadata, maar niet wat zichtbaar is op de foto. Vermijd
          personen en privégegevens in beeld. Onze scanner slaat foto's niet op; de verwerking valt onder de voorwaarden
          van Cloudflare.
        </p>
        <p>
          De gratis Cloudflare Workers- en Workers AI-abonnementen hebben harde gebruikslimieten. Bij een limiet of
          storing stopt scannen; handmatig loggen blijft werken. Activeer geen betaald abonnement als je geen kosten
          wilt. Internet en een eenmalig ingerichte scannerservice zijn nodig; de HTML-pagina alleen kan geen cloudscan
          uitvoeren. De app bewaart de toegangscode in de lokale browseropslag, niet in je geëxporteerde logboek.
        </p>
        <p>
          AI kan zich vergissen, ook bij een herkenbaar merk. Niet-leesbare hoeveelheden en percentages horen leeg te
          blijven: bevestig altijd zelf de naam, portiegrootte en het alcoholpercentage. Het flesvolume is niet
          noodzakelijk je gedronken portie.
        </p>
        <p>
          Vormgeving geïnspireerd op de rijkshuisstijl, zonder rijkslogo of overheidsverband. RO Sans wordt alleen
          gebruikt als het lokaal is geïnstalleerd; anders het systeemlettertype.
        </p>
      </div>
    </details>
  );
}
