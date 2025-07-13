updated(_changeProps) {
  if (_changeProps.has('open')) {
    if (this.open) {
      // Ждём, пока произойдёт ререндер компонента и слота
      this.updateComplete.then(() => {
        requestAnimationFrame(() => {
          console.log('[CollapseItem] Item opened — making content focusable');
          this._setFocusableState(false);
          if (this.autoFocusFirst) {
            this.focusFirstInteractive();
          } else {
            this._justOpened = true;
          }
        });
      });
    } else {
      console.log('[CollapseItem] Item closed — disabling content focus');
      this._setFocusableState(true);
    }
  }
}