/**
 * SHOPFLEXMOVE — Product Page JavaScript
 * Variant switching, gallery, quantity breaks, sticky ATC
 */

(function() {
  'use strict';

  const ProductPage = {
    product: null,
    currentVariant: null,
    selectedQuantity: 1,

    init() {
      const productDataEl = document.getElementById('product-json');
      if (!productDataEl) return;

      try {
        this.product = JSON.parse(productDataEl.textContent);
      } catch (e) {
        console.error('Failed to parse product data:', e);
        return;
      }

      this.currentVariant = this.product.variants[0];
      this.bindEvents();
      this.initGallery();
      this.initQuantityBreaks();
      this.initStickyATC();
      this.updateVariantUI();

      // Track product view
      if (typeof window.ShopFlexAnalytics !== 'undefined') {
        window.ShopFlexAnalytics.trackViewItem(this.product, this.currentVariant);
      }
    },

    bindEvents() {
      // Variant options
      document.querySelectorAll('[data-variant-option]').forEach(option => {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          this.selectVariantOption(option);
        });
      });

      // Variant select dropdown (fallback)
      const variantSelect = document.getElementById('product-variant-select');
      if (variantSelect) {
        variantSelect.addEventListener('change', () => {
          const variantId = parseInt(variantSelect.value, 10);
          this.selectVariantById(variantId);
        });
      }

      // FAQ accordions on product page
      document.querySelectorAll('.faq-item__trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
          const item = trigger.closest('.faq-item');
          const isOpen = item.classList.contains('is-open');

          // Close all others
          document.querySelectorAll('.faq-item.is-open').forEach(openItem => {
            openItem.classList.remove('is-open');
          });

          // Toggle current
          if (!isOpen) {
            item.classList.add('is-open');
          }
        });
      });

      // Sizing chart modal triggers
      const sizeModal = document.getElementById('size-chart-modal');
      const sizeTriggers = document.querySelectorAll('[data-size-modal-trigger]');
      const closeTriggers = document.querySelectorAll('[data-close-size-modal]');

      if (sizeModal) {
        sizeTriggers.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openSizeModal(sizeModal);
          });
        });

        closeTriggers.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeSizeModal(sizeModal);
          });
        });

        // Close on Escape key
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && sizeModal.classList.contains('is-open')) {
            this.closeSizeModal(sizeModal);
          }
        });
      }
    },

    openSizeModal(modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    },

    closeSizeModal(modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    },

    selectVariantOption(option) {
      const optionGroup = option.closest('.variant-selector__options');
      optionGroup.querySelectorAll('.variant-selector__option').forEach(opt => {
        opt.classList.remove('is-selected');
      });
      option.classList.add('is-selected');

      // Build selected options array
      const selectedOptions = [];
      document.querySelectorAll('.variant-selector__options').forEach(group => {
        const selected = group.querySelector('.is-selected');
        if (selected) {
          selectedOptions.push(selected.dataset.value);
        }
      });

      // Find matching variant
      const variant = this.product.variants.find(v => {
        return v.options.every((opt, i) => opt === selectedOptions[i]);
      });

      if (variant) {
        this.currentVariant = variant;
        this.updateVariantUI();
      }
    },

    selectVariantById(id) {
      const variant = this.product.variants.find(v => v.id === id);
      if (variant) {
        this.currentVariant = variant;
        this.updateVariantUI();
      }
    },

    updateVariantUI() {
      if (!this.currentVariant) return;

      // Update price
      const priceEl = document.getElementById('product-price');
      const comparePriceEl = document.getElementById('product-compare-price');

      if (priceEl) {
        priceEl.textContent = this.formatMoney(this.currentVariant.price);
      }

      if (comparePriceEl) {
        if (this.currentVariant.compare_at_price && this.currentVariant.compare_at_price > this.currentVariant.price) {
          comparePriceEl.textContent = this.formatMoney(this.currentVariant.compare_at_price);
          comparePriceEl.style.display = '';
        } else {
          comparePriceEl.style.display = 'none';
        }
      }

      // Update add to cart button
      const atcBtn = document.getElementById('product-atc-btn');
      const variantInput = document.getElementById('product-variant-id');

      if (variantInput) {
        variantInput.value = this.currentVariant.id;
      }

      if (atcBtn) {
        if (this.currentVariant.available) {
          atcBtn.disabled = false;
          atcBtn.textContent = 'Add to Cart';
        } else {
          atcBtn.disabled = true;
          atcBtn.textContent = 'Sold Out';
        }
      }

      // Update variant select dropdown
      const variantSelect = document.getElementById('product-variant-select');
      if (variantSelect) {
        variantSelect.value = this.currentVariant.id;
      }

      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('variant', this.currentVariant.id);
      window.history.replaceState({}, '', url.toString());

      // Update gallery image if variant has featured image
      if (this.currentVariant.featured_image) {
        this.switchMainImage(this.currentVariant.featured_image.src);
      }

      // Update sticky ATC
      const stickyPrice = document.getElementById('sticky-atc-price');
      if (stickyPrice) {
        stickyPrice.textContent = this.formatMoney(this.currentVariant.price);
      }
    },

    // --- Gallery ---
    initGallery() {
      const thumbnails = document.querySelectorAll('.product-gallery__thumb');
      const mainImage = document.querySelector('.product-gallery__main img');

      if (!mainImage || thumbnails.length === 0) return;

      thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbnails.forEach(t => t.classList.remove('is-active'));
          thumb.classList.add('is-active');

          const imgSrc = thumb.querySelector('img').dataset.fullSrc || thumb.querySelector('img').src;
          this.switchMainImage(imgSrc);
        });
      });

      // Touch swipe support for mobile
      let touchStartX = 0;
      const gallery = document.querySelector('.product-gallery__main');
      if (gallery) {
        gallery.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
        }, { passive: true });

        gallery.addEventListener('touchend', (e) => {
          const touchEndX = e.changedTouches[0].clientX;
          const diff = touchStartX - touchEndX;

          if (Math.abs(diff) > 50) {
            const currentIndex = Array.from(thumbnails).findIndex(t => t.classList.contains('is-active'));
            let nextIndex;

            if (diff > 0) {
              nextIndex = Math.min(currentIndex + 1, thumbnails.length - 1);
            } else {
              nextIndex = Math.max(currentIndex - 1, 0);
            }

            thumbnails[nextIndex].click();
          }
        }, { passive: true });
      }
    },

    switchMainImage(src) {
      const mainImage = document.querySelector('.product-gallery__main img');
      if (mainImage) {
        mainImage.style.opacity = '0';
        setTimeout(() => {
          mainImage.src = src;
          mainImage.style.opacity = '1';
        }, 150);
      }
    },

    // --- Quantity Breaks ---
    initQuantityBreaks() {
      const breaks = document.querySelectorAll('.quantity-break');
      if (breaks.length === 0) return;

      breaks.forEach(breakEl => {
        breakEl.addEventListener('click', () => {
          breaks.forEach(b => b.classList.remove('is-selected'));
          breakEl.classList.add('is-selected');

          this.selectedQuantity = parseInt(breakEl.dataset.quantity, 10);
          const quantityInput = document.getElementById('product-quantity');
          if (quantityInput) {
            quantityInput.value = this.selectedQuantity;
          }
        });
      });
    },

    // --- Sticky ATC ---
    initStickyATC() {
      const stickyATC = document.querySelector('.sticky-atc');
      const atcSection = document.querySelector('.product-atc');

      if (!stickyATC || !atcSection) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (window.innerWidth <= 768) {
            stickyATC.style.display = entry.isIntersecting ? 'none' : 'block';
          }
        },
        { threshold: 0 }
      );

      observer.observe(atcSection);

      // Sticky ATC button action
      const stickyBtn = stickyATC.querySelector('.sticky-atc__button');
      if (stickyBtn) {
        stickyBtn.addEventListener('click', () => {
          const mainForm = document.querySelector('form[data-add-to-cart]');
          if (mainForm) {
            mainForm.dispatchEvent(new Event('submit'));
          }
        });
      }
    },

    formatMoney(cents) {
      return '$' + (cents / 100).toFixed(2);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProductPage.init());
  } else {
    ProductPage.init();
  }

  window.ShopFlexProduct = ProductPage;
})();
