firstUpdated() {
    this.updateItemIndices();

    this.addEventListener('requestToggle', (e) => {
      const { index } = e.detail;
      const items = this.items;

      if (this.singleOpen) {
        const isAlreadyOpen = items[index]?.open;
        items.forEach((item, i) => {
          item.open = (i === index) ? !isAlreadyOpen : false;
        });
      } else {
        const targetItem = items[index];
        if (targetItem) {
          targetItem.open = !targetItem.open;
        }
      }
    });
  }