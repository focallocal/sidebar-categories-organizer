import { apiInitializer } from "discourse/lib/api";
import { schedule } from "@ember/runloop";

export default apiInitializer("1.8.0", (api) => {
  if (!settings.enable_sidebar_organizer) {
    return;
  }

  // Get user preference from localStorage
  const getUserPreference = () => {
    return localStorage.getItem("sidebar-view-preference") || settings.default_view;
  };

  // Save user preference to localStorage
  const saveUserPreference = (preference) => {
    localStorage.setItem("sidebar-view-preference", preference);
  };

  // Build the custom categories view
  const buildCustomCategoriesView = () => {
    const appCtrl = api.container.lookup("controller:application");
    if (!appCtrl || !appCtrl.site || !appCtrl.site.categories) {
      console.log("Categories not available yet");
      return null;
    }

    const allCategories = appCtrl.site.categories;
    const currentUser = api.getCurrentUser();
    
    // Filter categories based on user permissions
    const accessibleCategories = allCategories.filter(cat => {
      if (!currentUser) return !cat.read_restricted;
      // Category is accessible if not read_restricted, or user has permission
      return true; // Discourse handles permissions in the category objects
    });

    const customContainer = document.createElement("div");
    customContainer.id = "custom-categories-sidebar";
    customContainer.className = "sidebar-section-wrapper";

    // Track which categories are in groups
    const groupedCategorySlugs = new Set();

    // Build sections 1-10
    for (let i = 1; i <= 10; i++) {
      const enabled = settings[`section_${i}_enabled`];
      if (!enabled) continue;

      const title = settings[`section_${i}_title`];
      const categorySlugs = settings[`section_${i}_categories`];
      const defaultOpen = settings[`section_${i}_default_open`];
      
      if (!categorySlugs || categorySlugs.trim() === "") continue;

      // Get categories for this section
      const slugArray = categorySlugs.split(",").map(s => s.trim());
      const sectionCategories = slugArray
        .map(slug => accessibleCategories.find(cat => cat.slug === slug))
        .filter(Boolean);

      if (sectionCategories.length === 0) continue;

      // Track these categories as grouped
      sectionCategories.forEach(cat => groupedCategorySlugs.add(cat.slug));

      // Check localStorage for this section's state
      const storedState = localStorage.getItem(`sidebar-section-${i}-state`);
      const isOpen = storedState !== null ? storedState === "open" : defaultOpen;

      // Create section
      const section = document.createElement("div");
      section.className = "sidebar-section-message sidebar-section";
      section.dataset.sectionId = i;

      const sectionHeader = document.createElement("details");
      sectionHeader.className = "category-section-details";
      sectionHeader.open = isOpen;
      
      // Save state on toggle
      sectionHeader.addEventListener("toggle", (e) => {
        const state = e.target.open ? "open" : "closed";
        localStorage.setItem(`sidebar-section-${i}-state`, state);
      });

      const summary = document.createElement("summary");
      summary.className = "category-section-summary";
      summary.dataset.section = i;
      summary.innerHTML = `<span class="category-section-title">${title}</span>`;

      const contentWrapper = document.createElement("div");
      contentWrapper.className = "category-section-content";

      // Add categories
      sectionCategories.forEach(category => {
        const categoryLink = document.createElement("a");
        categoryLink.href = `/c/${category.slug}/${category.id}`;
        categoryLink.className = "sidebar-section-link sidebar-section-link-content-list";
        
        const linkContent = document.createElement("span");
        linkContent.className = "sidebar-section-link-content-text";
        
        // Add category badge if enabled
        if (settings.show_category_badges) {
          const badge = document.createElement("span");
          badge.className = "category-badge";
          badge.style.backgroundColor = `#${category.color}`;
          linkContent.appendChild(badge);
        }
        
        const categoryName = document.createTextNode(category.name);
        linkContent.appendChild(categoryName);
        
        categoryLink.appendChild(linkContent);
        contentWrapper.appendChild(categoryLink);

        // Add subcategories if enabled for this section
        if (settings[`section_${i}_show_subcategories`]) {
          const subcategories = accessibleCategories.filter(cat => 
            cat.parent_category_id === category.id
          );

          subcategories.forEach(subcat => {
            groupedCategorySlugs.add(subcat.slug);
            
            const subcatLink = document.createElement("a");
            subcatLink.href = `/c/${category.slug}/${subcat.slug}/${subcat.id}`;
            subcatLink.className = "sidebar-section-link sidebar-section-link-content-list subcategory-link";
            
            const subcatLinkContent = document.createElement("span");
            subcatLinkContent.className = "sidebar-section-link-content-text";
            
            // Add subcategory badge if enabled
            if (settings.show_category_badges) {
              const subcatBadge = document.createElement("span");
              subcatBadge.className = "category-badge";
              subcatBadge.style.backgroundColor = `#${subcat.color}`;
              subcatLinkContent.appendChild(subcatBadge);
            }
            
            const subcatName = document.createTextNode(subcat.name);
            subcatLinkContent.appendChild(subcatName);
            
            subcatLink.appendChild(subcatLinkContent);
            contentWrapper.appendChild(subcatLink);
          });
        }
      });

      sectionHeader.appendChild(summary);
      sectionHeader.appendChild(contentWrapper);
      section.appendChild(sectionHeader);
      customContainer.appendChild(section);
    }

    // Add ungrouped categories section
    const ungroupedCategories = accessibleCategories.filter(cat => 
      !groupedCategorySlugs.has(cat.slug) && !cat.parent_category_id
    );

    if (ungroupedCategories.length > 0) {
      const ungroupedSection = document.createElement("div");
      ungroupedSection.id = "ungrouped-categories-sidebar";
      ungroupedSection.className = "sidebar-section";

      const ungroupedTitle = document.createElement("div");
      ungroupedTitle.className = "ungrouped-categories-title";
      ungroupedTitle.textContent = "Other Categories";
      ungroupedSection.appendChild(ungroupedTitle);

      ungroupedCategories.forEach(category => {
        const categoryLink = document.createElement("a");
        categoryLink.href = `/c/${category.slug}/${category.id}`;
        categoryLink.className = "sidebar-section-link sidebar-section-link-content-list";
        
        const linkContent = document.createElement("span");
        linkContent.className = "sidebar-section-link-content-text";
        
        // Add category badge if enabled
        if (settings.show_category_badges) {
          const badge = document.createElement("span");
          badge.className = "category-badge";
          badge.style.backgroundColor = `#${category.color}`;
          linkContent.appendChild(badge);
        }
        
        const categoryName = document.createTextNode(category.name);
        linkContent.appendChild(categoryName);
        
        categoryLink.appendChild(linkContent);
        ungroupedSection.appendChild(categoryLink);

        // Add subcategories for ungrouped (always show)
        const showSubcats = true;
        if (showSubcats) {
          const subcategories = accessibleCategories.filter(cat => 
            cat.parent_category_id === category.id
          );

          subcategories.forEach(subcat => {
            const subcatLink = document.createElement("a");
            subcatLink.href = `/c/${category.slug}/${subcat.slug}/${subcat.id}`;
            subcatLink.className = "sidebar-section-link sidebar-section-link-content-list subcategory-link";
            
            const subcatLinkContent = document.createElement("span");
            subcatLinkContent.className = "sidebar-section-link-content-text";
            
            // Add subcategory badge if enabled
            if (settings.show_category_badges) {
              const subcatBadge = document.createElement("span");
              subcatBadge.className = "category-badge";
              subcatBadge.style.backgroundColor = `#${subcat.color}`;
              subcatLinkContent.appendChild(subcatBadge);
            }
            
            const subcatName = document.createTextNode(subcat.name);
            subcatLinkContent.appendChild(subcatName);
            
            subcatLink.appendChild(subcatLinkContent);
            ungroupedSection.appendChild(subcatLink);
          });
        }
      });

      customContainer.appendChild(ungroupedSection);
    }

    return customContainer;
  };

  // Toggle between custom and default view
  const toggleView = () => {
    const customView = document.getElementById("custom-categories-sidebar");
    const defaultSection = document.querySelector(".sidebar-section[data-section-name='categories']");
    
    if (!customView || !defaultSection) return;

    if (customView.style.display === "none") {
      customView.style.display = "block";
      defaultSection.style.display = "none";
      saveUserPreference("custom");
    } else {
      customView.style.display = "none";
      defaultSection.style.display = "block";
      saveUserPreference("default");
    }
  };

  // Initialize on page change
  api.onPageChange(() => {
    schedule("afterRender", () => {
      initializeSidebar();
    });
  });

  // Watch for sidebar visibility changes (when user toggles sidebar)
  const observer = new MutationObserver(() => {
    schedule("afterRender", () => {
      const sidebar = document.querySelector(".sidebar-sections");
      if (sidebar && sidebar.offsetParent !== null) {
        // Sidebar is visible, reinitialize if needed
        const existingCustomView = document.getElementById("custom-categories-sidebar");
        if (!existingCustomView) {
          initializeSidebar();
        }
      }
    });
  });

  // Start observing the body for sidebar changes
  schedule("afterRender", () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  });

  // Function to initialize/reinitialize sidebar
  function initializeSidebar() {
    const sidebar = document.querySelector(".sidebar-sections");
    const defaultCategoriesSection = document.querySelector(".sidebar-section[data-section-name='categories']");
    
    if (!sidebar || !defaultCategoriesSection) return;

    // Remove existing custom view if present
    const existingCustomView = document.getElementById("custom-categories-sidebar");
    if (existingCustomView) {
      existingCustomView.remove();
    }

    // Build and insert custom view
    const customView = buildCustomCategoriesView();
    if (!customView) return;

    // Insert after the categories section
    defaultCategoriesSection.parentNode.insertBefore(customView, defaultCategoriesSection.nextSibling);

    // Apply user preference
    const preference = getUserPreference();
    if (preference === "custom") {
      defaultCategoriesSection.style.display = "none";
      customView.style.display = "block";
    } else {
      defaultCategoriesSection.style.display = "block";
      customView.style.display = "none";
    }

    // Add toggle button if enabled
    if (settings.show_toggle_button) {
      const existingToggle = document.getElementById("sidebar-categories-toggle");
      if (existingToggle) {
        existingToggle.remove();
      }

      // Try multiple selectors for the categories header
      let categoriesHeader = defaultCategoriesSection.querySelector(".sidebar-section-header");
      
      // Fallback: create a header if it doesn't exist
      if (!categoriesHeader) {
        categoriesHeader = defaultCategoriesSection.querySelector(".sidebar-section-header-wrapper");
      }
      
      // Last resort: add to the section itself
      if (!categoriesHeader) {
        const headerWrapper = document.createElement("div");
        headerWrapper.className = "sidebar-section-header-wrapper";
        headerWrapper.style.cssText = "display: flex; align-items: center; padding: 0.5em 1em; justify-content: space-between;";
        
        const titleSpan = document.createElement("span");
        titleSpan.textContent = "Categories";
        titleSpan.style.fontWeight = "600";
        headerWrapper.appendChild(titleSpan);
        
        defaultCategoriesSection.insertBefore(headerWrapper, defaultCategoriesSection.firstChild);
        categoriesHeader = headerWrapper;
      }

      if (categoriesHeader) {
        const toggleButton = document.createElement("button");
        toggleButton.id = "sidebar-categories-toggle";
        toggleButton.className = "sidebar-section-header-button btn-flat";
        toggleButton.innerHTML = "⚙️";
        toggleButton.title = "Toggle custom/default categories view";
        toggleButton.style.cssText = "margin-left: auto; padding: 0.25em 0.5em; background: transparent; border: none; cursor: pointer; font-size: 1.2em;";
        toggleButton.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleView();
        });

        categoriesHeader.appendChild(toggleButton);
      }
    }
  }
});
