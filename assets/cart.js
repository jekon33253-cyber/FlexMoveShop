/**
 * SHOPFLEXMOVE — Cart Functionality
 * AJAX cart, cart drawer, free shipping bar
 */

(function() {
  'use strict';

  const Cart = {
    drawer: null,
    overlay: null,
    itemsContainer: null,
    countElements: null,
    subtotalElement: null,
    shippingBar: null,
    freeShippingThreshold: 49,

    init() {
      this.drawer = document.getElementById('cart-drawer');
      this.overlay = document.getElementById('cart-overlay');
      this.itemsContainer = document.getElementById('cart-drawer-items');
      this.countElements = document.querySelectorAll('[data-cart-count]');
      this.subtotalElement = document.getElementById('cart-drawer-subtotal');
      this.shippingBar = document.getElementById('cart-shipping-bar');

      const thresholdEl = document.querySelector('[data-free-shipping-threshold]');
      if (thresholdEl) {
        this.freeShippingThreshold = parseInt(thresholdEl.dataset.freeShippingThreshold, 10);
      }

      this.bindEvents();
      this.fetchCart();
    },

    bindEvents() {
      // Open cart drawer
      document.querySelectorAll('[data-cart-toggle]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openDrawer();
        });
      });

      // Close cart drawer
      document.querySelectorAll('[data-cart-close]').forEach(btn => {
        btn.addEventListener('click', () => this.closeDrawer());
      });

      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.closeDrawer());
      }

      // Add to cart forms
      document.querySelectorAll('form[data-add-to-cart]').forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.addToCart(form);
        });
      });

      // Quick add buttons
      document.querySelectorAll('[data-quick-add]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const variantId = btn.dataset.variantId;
          const quantity = parseInt(btn.dataset.quantity || '1', 10);
          this.addItem(variantId, quantity);
        });
      });

      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeDrawer();
      });
    },

    async fetchCart() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        this.updateUI(cart);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    },

    async addToCart(form) {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.classList.add('btn--loading');
        submitBtn.disabled = true;
      }

      try {
        const formData = new FormData(form);
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to add to cart');

        const item = await response.json();
        await this.fetchCart();
        this.openDrawer();

        // Analytics event
        if (typeof window.ShopFlexAnalytics !== 'undefined') {
          window.ShopFlexAnalytics.trackAddToCart(item);
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        if (submitBtn) {
          submitBtn.classList.remove('btn--loading');
          submitBtn.disabled = false;
        }
      }
    },

    async addItem(variantId, quantity = 1) {
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity }),
        });

        if (!response.ok) throw new Error('Failed to add item');

        await this.fetchCart();
        this.openDrawer();
      } catch (error) {
        console.error('Error adding item:', error);
      }
    },

    async updateItem(key, quantity) {
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity }),
        });

        if (!response.ok) throw new Error('Failed to update cart');

        const cart = await response.json();
        this.updateUI(cart);
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    },

    async removeItem(key) {
      await this.updateItem(key, 0);
    },

    updateUI(cart) {
      // Update count badges
      this.countElements.forEach(el => {
        el.textContent = cart.item_count;
        el.style.display = cart.item_count > 0 ? 'flex' : 'none';
      });

      // Update subtotal
      if (this.subtotalElement) {
        this.subtotalElement.textContent = this.formatMoney(cart.total_price);
      }

      // Update shipping bar
      this.updateShippingBar(cart.total_price);

      // Update items
      if (this.itemsContainer) {
        if (cart.items.length === 0) {
          this.itemsContainer.innerHTML = `
            <div class="cart-drawer__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <p>Your cart is empty</p>
              <a href="/collections/all" class="btn btn--primary">Start Shopping</a>
            </div>
          `;
        } else {
          this.itemsContainer.innerHTML = cart.items.map(item => `
            <div class="cart-drawer__item" data-key="${item.key}">
              <div class="cart-drawer__item-image">
                <img src="${item.image || ''}" alt="${item.title}" width="80" height="80" loading="lazy">
              </div>
              <div class="cart-drawer__item-info">
                <h4 class="cart-drawer__item-title">${item.product_title}</h4>
                ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-drawer__item-variant">${item.variant_title}</p>` : ''}
                <p class="cart-drawer__item-price">${this.formatMoney(item.final_line_price)}</p>
                <div class="cart-drawer__item-qty">
                  <button class="cart-drawer__qty-btn" data-action="decrease" data-key="${item.key}" data-qty="${item.quantity}" aria-label="Decrease quantity">−</button>
                  <span class="cart-drawer__qty-value">${item.quantity}</span>
                  <button class="cart-drawer__qty-btn" data-action="increase" data-key="${item.key}" data-qty="${item.quantity}" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <button class="cart-drawer__item-remove" data-key="${item.key}" aria-label="Remove ${item.title}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          `).join('');

          // Bind item events
          this.itemsContainer.querySelectorAll('[data-action="decrease"]').forEach(btn => {
            btn.addEventListener('click', () => {
              const key = btn.dataset.key;
              const qty = parseInt(btn.dataset.qty, 10);
              this.updateItem(key, Math.max(0, qty - 1));
            });
          });

          this.itemsContainer.querySelectorAll('[data-action="increase"]').forEach(btn => {
            btn.addEventListener('click', () => {
              const key = btn.dataset.key;
              const qty = parseInt(btn.dataset.qty, 10);
              this.updateItem(key, qty + 1);
            });
          });

          this.itemsContainer.querySelectorAll('.cart-drawer__item-remove').forEach(btn => {
            btn.addEventListener('click', () => this.removeItem(btn.dataset.key));
          });
        }
      }
    },

    updateShippingBar(totalPrice) {
      if (!this.shippingBar) return;

      const totalDollars = totalPrice / 100;
      const remaining = this.freeShippingThreshold - totalDollars;
      const progressBar = this.shippingBar.querySelector('.shipping-bar__progress');
      const messageEl = this.shippingBar.querySelector('.shipping-bar__message');

      if (remaining <= 0) {
        if (progressBar) progressBar.style.width = '100%';
        if (messageEl) messageEl.innerHTML = '🎉 You\'ve unlocked <strong>FREE shipping!</strong>';
        this.shippingBar.classList.add('is-complete');
      } else {
        const progress = Math.min((totalDollars / this.freeShippingThreshold) * 100, 100);
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (messageEl) messageEl.innerHTML = `Add <strong>$${remaining.toFixed(2)}</strong> more for <strong>FREE shipping!</strong>`;
        this.shippingBar.classList.remove('is-complete');
      }
    },

    openDrawer() {
      if (this.drawer) {
        this.drawer.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
      if (this.overlay) {
        this.overlay.classList.add('is-active');
      }
    },

    closeDrawer() {
      if (this.drawer) {
        this.drawer.classList.remove('is-open');
        document.body.style.overflow = '';
      }
      if (this.overlay) {
        this.overlay.classList.remove('is-active');
      }
    },

    formatMoney(cents) {
      return '$' + (cents / 100).toFixed(2);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Cart.init());
  } else {
    Cart.init();
  }

  // Expose for external use
  window.ShopFlexCart = Cart;
})();
