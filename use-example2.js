<my-collapse-list
  header="Meine Funktionen"
  footer="Mehr Funktionen folgen bald"
  singleOpen
>
  <div class="list-item">
    <my-collapse-item
      title="Kartenlimits ändern"
      subtitle="Sicher & flexibel"
      .tags=${['App', 'Web']}
      initialOpen
      allowOpenOnContainerClick
    >
      <p>
        Sie wollen die volle Kontrolle über Ihre geschäftlichen Ausgaben haben und gleichzeitig flexibel sein? Kein Problem! 
        Passen Sie Ihre Kartenlimits für Bargeldauszahlungen und Kartenzahlungen jederzeit selbst an – direkt im Business Banking Home oder in unserer Business App.
      </p>
      <p>
        <strong>Übrigens:</strong> Das mögliche Tageslimit für Bargeldabhebungen liegt bei 5.000 Euro; das Monatslimit bei 50.000 Euro.
      </p>
    </my-collapse-item>
  </div>

  <div class="list-item">
    <my-collapse-item
      title="Die Feedback-Funktion"
      subtitle="Vielen Dank für Ihre Meinung"
      .tags=${['Web']}
      allowOpenOnContainerClick
    >
      <p>
        Seit unsere Feedback-Funktion für Sie freigeschaltet ist, haben Sie uns schon jede Menge wertvolle Rückmeldungen gegeben – einen dicken Dank dafür!
        Wirklich jedes Feedback hilft uns dabei, unser Business Banking zu verbessern.
      </p>
    </my-collapse-item>
  </div>

  <div class="list-item">
    <my-collapse-item
      title="Demnächst verfügbar"
      subtitle="Kleiner Ausblick"
      .tags=${['Coming Soon']}
      allowOpenOnContainerClick
    >
      <p>• Überweisungslimit ändern</p>
      <p>• Transaktionssuche</p>
      <p>• FAQ-Suche</p>
    </my-collapse-item>
  </div>
</my-collapse-list>