# Admin Dashboard Enhancement TODO

## Task 1: Add Admin & Delivery Management Section
- [ ] Update sidebar in admin/index.html to include "Admin & Delivery Management" link
- [ ] Update sidebar in admin/orders.html to include "Admin & Delivery Management" link
- [ ] Update sidebar in admin/manage-menu.html to include "Admin & Delivery Management" link
- [ ] Update sidebar in admin/order-status.html to include "Admin & Delivery Management" link
- [ ] Update sidebar in admin/promotions.html to include "Admin & Delivery Management" link
- [ ] Update sidebar in admin/reports.html to include "Admin & Delivery Management" link
- [ ] Create admin/manage-admins.html with view, add, edit, delete admin functionality
- [ ] Create admin/manage-delivery.html with view, add, edit, delete delivery agent functionality
- [ ] Update admin/admin.js to handle new API endpoints for admin/delivery management
- [ ] Ensure new pages follow glass-card style, responsive design, and dark/light mode

## Task 2: Fix Emoji Bug
- [ ] Remove emojis from sidebar links in admin/orders.html
- [ ] Remove emojis from sidebar links in admin/index.html
- [ ] Remove emojis from sidebar links in admin/manage-menu.html
- [ ] Remove emojis from sidebar links in admin/order-status.html
- [ ] Remove emojis from sidebar links in admin/promotions.html
- [ ] Remove emojis from sidebar links in admin/reports.html
- [ ] Search and remove any dynamic emoji injection in admin/admin.js

## Task 3: Fix Dashboard Jumping
- [ ] Ensure sidebar and main-content layout remains static during navigation
- [ ] Update admin/admin.css to prevent layout shifts
- [ ] Ensure only inner content updates smoothly

## Task 4: Ensure Sidebar Toggle Works
- [ ] Verify hamburger toggle hides/shows sidebar without affecting content
- [ ] Remove any old toggle logic that might interfere

## Task 5: Global UI Consistency
- [ ] Confirm dark/light mode works in new pages
- [ ] Ensure marble background and glass effects are applied correctly

## Task 6: Update Backend Integration Guide
- [ ] Add Admin Management section with API endpoints, payloads, responses
- [ ] Add Delivery Agent Management section with API endpoints, payloads, responses
- [ ] Include authentication flow, sidebar/navigation events, JS architecture, file structure

## Task 7: Clean Code
- [ ] Remove unused CSS/JS
- [ ] Ensure no double event listeners
- [ ] Refactor code for cleanliness

## Followup Steps
- [ ] Test navigation and toggles
- [ ] Verify backend-ready forms
- [ ] Ensure no layout jumping
