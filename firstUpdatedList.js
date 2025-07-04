firstUpdated() {
    this.addEventListener('requestToggle', (e) => {
      const { index } = e.detail;
      const items = this.items;

      if (this.singleOpen) {
        items.forEach((item, i) => {
          item.open = (i === index);
        });
      } else {
        const targetItem = items[index];
        if (targetItem) {
          targetItem.open = !targetItem.open;
        }
      }
    });
  }