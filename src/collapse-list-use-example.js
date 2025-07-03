<my-collapse-list id="myList" singleOpen>
  <div class="list-item">
    <my-collapse-item initialOpen allowOpenOnContainerClick>
      <span slot="summary">Item 1: Click to expand</span>
      <div slot="details">
        <p>Details for Item 1</p>
        <button>Focusable Button 1</button>
      </div>
    </my-collapse-item>
  </div>

  <div class="list-item">
    <my-collapse-item allowOpenOnContainerClick>
      <span slot="summary">Item 2: Click to expand</span>
      <div slot="details">
        <p>Details for Item 2</p>
        <a href="#">Focusable Link 2</a>
      </div>
    </my-collapse-item>
  </div>

  <div class="list-item">
    <my-collapse-item allowOpenOnContainerClick>
      <span slot="summary">Item 3: Click to expand</span>
      <div slot="details">
        <p>Details for Item 3</p>
        <custom-button tabindex="0">Custom Focusable</custom-button>
      </div>
    </my-collapse-item>
  </div>
</my-collapse-list>

<script type="module">
  const list = document.getElementById('myList');

  // Пример программного открытия
  list.open(1); // открыть 2-й элемент

  // Пример открытия нескольких (если singleOpen=false)
  // list.open([0, 2]);

  // Пример закрытия всех
  // list.closeAll();

  // Подписка на события
  list.addEventListener('itemToggled', (e) => {
    console.log('Item toggled:', e.detail);
  });

  list.addEventListener('stateChange', (e) => {
    console.log('Open indexes:', e.detail.openIndexes);
  });
</script>