/**
 * SHOPFLEXMOVE — Analytics Event Tracking
 * GA4 + Meta Pixel + Custom Events
 */

(function() {
  'use strict';

  const Analytics = {
    init() {
      this.trackPageView();
    },

    /**
     * Track page view
     */
    trackPageView() {
      // GA4 page view is handled by GTM or gtag auto-config
      // Meta Pixel PageView
      if (typeof fbq !== 'undefined') {
        fbq('track', 'PageView');
      }
    },

    /**
     * Track product view (view_item)
     */
    trackViewItem(product, variant) {
      const item = this.buildItem(product, variant);

      // GA4 via dataLayer
      this.pushDataLayer({
        event: 'view_item',
        ecommerce: {
          currency: 'USD',
          value: item.price,
          items: [item]
        }
      });

      // Meta Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'ViewContent', {
          content_ids: [variant.id || product.id],
          content_name: product.title,
          content_type: 'product',
          value: item.price,
          currency: 'USD'
        });
      }
    },

    /**
     * Track add to cart
     */
    trackAddToCart(item) {
      const price = item.final_line_price ? item.final_line_price / 100 : item.price / 100;

      // GA4 via dataLayer
      this.pushDataLayer({
        event: 'add_to_cart',
        ecommerce: {
          currency: 'USD',
          value: price,
          items: [{
            item_id: item.variant_id || item.id,
            item_name: item.product_title || item.title,
            price: price,
            quantity: item.quantity || 1
          }]
        }
      });

      // Meta Pixel
      if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
          content_ids: [item.variant_id || item.id],
          content_name: item.product_title || item.title,
          content_type: 'product',
          value: price,
          currency: 'USD'
        });
      }
    },

    /**
     * Track begin checkout
     */
    trackBeginCheckout(cart) {
      const items = cart.items.map(item => ({
        item_id: item.variant_id,
        item_name: item.product_title,
        price: item.final_line_price / 100,
        quantity: item.quantity
      }));

      this.pushDataLayer({
        event: 'begin_checkout',
        ecommerce: {
          currency: 'USD',
          value: cart.total_price / 100,
          items: items
        }
      });

      if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
          content_ids: cart.items.map(i => i.variant_id),
          num_items: cart.item_count,
          value: cart.total_price / 100,
          currency: 'USD'
        });
      }
    },

    /**
     * Track purchase (called from thank you page)
     */
    trackPurchase(order) {
      this.pushDataLayer({
        event: 'purchase',
        ecommerce: {
          transaction_id: order.order_number,
          currency: 'USD',
          value: order.total_price,
          shipping: order.shipping_price || 0,
          tax: order.tax_price || 0,
          items: order.items || []
        }
      });

      if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
          content_ids: order.item_ids || [],
          content_type: 'product',
          value: order.total_price,
          currency: 'USD',
          num_items: order.item_count || 0
        });
      }
    },

    /**
     * Track collection view
     */
    trackViewCollection(collection) {
      this.pushDataLayer({
        event: 'view_item_list',
        ecommerce: {
          item_list_id: collection.handle,
          item_list_name: collection.title,
          items: collection.products || []
        }
      });
    },

    /**
     * Track search
     */
    trackSearch(query, resultCount) {
      this.pushDataLayer({
        event: 'search',
        search_term: query,
        result_count: resultCount
      });
    },

    /**
     * Build GA4 item object
     */
    buildItem(product, variant) {
      return {
        item_id: variant ? variant.id : product.id,
        item_name: product.title,
        item_variant: variant ? variant.title : '',
        price: variant ? variant.price / 100 : product.price / 100,
        quantity: 1,
        item_category: product.type || '',
        item_brand: 'SHOPFLEXMOVE'
      };
    },

    /**
     * Push to GTM dataLayer
     */
    pushDataLayer(data) {
      window.dataLayer = window.dataLayer || [];

      // Clear previous ecommerce data
      if (data.ecommerce) {
        window.dataLayer.push({ ecommerce: null });
      }

      window.dataLayer.push(data);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
  } else {
    Analytics.init();
  }

  window.ShopFlexAnalytics = Analytics;
})();
