// ===============================================
// Cart Management Module
// ===============================================

import { Storage, STORAGE_KEYS, Utils } from './utils.js';

export class CartManager {
    constructor() {
        this.cart = Storage.get(STORAGE_KEYS.CART, []);
        this.init();
    }

    init() {
        this.renderCart();
        this.bindEvents();
    }

    bindEvents() {
        // Bind events if needed (delegation usually better in main app)
    }

    addItem(item) {
        // item: { id, name, price, image }
        const existingItem = this.cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...item,
                quantity: 1
            });
        }
        this.saveCart();
        Utils.showNotification(`${item.name} added to cart!`, 'success');
        this.renderCart();
    }

    updateQuantity(id, newQuantity) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            item.quantity = Math.max(1, newQuantity);
            this.saveCart();
            this.renderCart();
        }
    }

    removeItem(index) {
        const itemName = this.cart[index].name;
        this.cart.splice(index, 1);
        this.saveCart();
        Utils.showNotification(`${itemName} removed from cart!`, 'success');
        this.renderCart();
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    saveCart() {
        Storage.set(STORAGE_KEYS.CART, this.cart);
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
        this.renderCart();
    }

    getCartItems() {
        return [...this.cart];
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        const cartEmpty = document.getElementById('cart-empty');
        const subtotalEl = document.getElementById('subtotal');
        const taxEl = document.getElementById('tax');
        const deliveryEl = document.getElementById('delivery-fee');
        const totalEl = document.getElementById('total');

        if (!cartItems) return; // Guard clause for pages without cart

        cartItems.innerHTML = '';

        if (this.cart.length === 0) {
            if (cartTotal) cartTotal.style.display = 'none';
            if (cartEmpty) cartEmpty.style.display = 'block';
            return;
        }

        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartTotal) cartTotal.style.display = 'block';

        this.cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-card';
            itemElement.innerHTML = `
                <div class="cart-img-wrapper">
                    <img src="${item.image}" alt="${item.name}" class="cart-img">
                </div>
                <div class="cart-details">
                    <h3 class="cart-name">${item.name}</h3>
                    <p class="cart-price">${Utils.formatPrice(item.price)}</p>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="window.updateCartQty(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="window.updateCartQty(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="cart-delete-btn" onclick="window.removeCartItem(${index})">🗑️</button>
            `;
            cartItems.appendChild(itemElement);
        });
        
        const cartSum = this.getTotal();
        const deliveryFee = 5;
        const tax = 0.5;
        const finalTotal = cartSum + deliveryFee + tax;
        if (subtotalEl) subtotalEl.textContent = Utils.formatPrice(cartSum);
        if (deliveryEl) deliveryEl.textContent = Utils.formatPrice(deliveryFee);
        if (taxEl) taxEl.textContent = Utils.formatPrice(tax);
        if (totalEl) totalEl.textContent = Utils.formatPrice(finalTotal);
    }
}
