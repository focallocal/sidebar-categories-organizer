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
    
    // Get categories to hide - handle both list format (array of IDs) and legacy string format
    let hiddenSlugs = [];
    if (settings.categories_to_hide) {
      if (Array.isArray(settings.categories_to_hide)) {
        // New list format: array of category IDs
        hiddenSlugs = settings.categories_to_hide
          .map(id => allCategories.find(cat => cat.id === parseInt(id)))
          .filter(Boolean)
          .map(cat => cat.slug);
      } else if (typeof settings.categories_to_hide === 'string' && settings.categories_to_hide.trim() !== "") {
        // Legacy string format: comma-separated slugs
        hiddenSlugs = settings.categories_to_hide.split(",").map(s => s.trim()).filter(s => s !== "");
      }
    }
    
    // Filter categories based on user permissions and hidden list
    // Note: site.categories is already filtered by Discourse based on current user permissions
    const accessibleCategories = allCategories.filter(cat => {
      // Hide categories from the hidden list
      if (hiddenSlugs.includes(cat.slug)) return false;
      
      // For anonymous users, only show non-restricted categories
      if (!currentUser && cat.read_restricted) return false;
      
      // For logged-in users, Discourse has already filtered the categories list
      return true;
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
      const categoriesData = settings[`section_${i}_categories`];
      const defaultOpen = settings[`section_${i}_default_open`];
      
      console.log(`Section ${i}:`, {
        enabled,
        title,
        categoriesData,
        type: typeof categoriesData,
        isArray: Array.isArray(categoriesData),
        isEmpty: categoriesData === "" || (Array.isArray(categoriesData) && categoriesData.length === 0)
      });
      
      if (!categoriesData) continue;
      if (Array.isArray(categoriesData) && categoriesData.length === 0) continue;
      if (typeof categoriesData === 'string' && categoriesData.trim() === "") continue;

      // Get categories for this section - handle both list format (array) and legacy string format
      let sectionCategories = [];
      if (Array.isArray(categoriesData)) {
        // New list format: array of category IDs
        console.log(`Section ${i} processing as array:`, categoriesData);
        sectionCategories = categoriesData
          .map(id => accessibleCategories.find(cat => cat.id === parseInt(id)))
          .filter(Boolean);
      } else if (typeof categoriesData === 'string') {
        // Legacy string format: comma-separated slugs
        console.log(`Section ${i} processing as string:`, categoriesData);
        const slugArray = categoriesData.split(",").map(s => s.trim()).filter(s => s !== "");
        sectionCategories = slugArray
          .map(slug => accessibleCategories.find(cat => cat.slug === slug))
          .filter(Boolean);
      }

      console.log(`Section ${i} found categories:`, sectionCategories.map(c => c.name));

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
    const defaultToggleBtn = document.getElementById("default-view-toggle-btn");
    
    if (!customView || !defaultSection) return;

    if (customView.style.display === "none") {
      customView.style.display = "block";
      defaultSection.style.display = "none";
      if (defaultToggleBtn) defaultToggleBtn.style.display = "none";
      saveUserPreference("custom");
    } else {
      customView.style.display = "none";
      defaultSection.style.display = "block";
      if (defaultToggleBtn) defaultToggleBtn.style.display = "block";
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

    // Remove existing default toggle button if present
    const existingDefaultToggle = document.getElementById("default-view-toggle-btn");
    if (existingDefaultToggle) {
      existingDefaultToggle.remove();
    }

    // Build and insert custom view
    const customView = buildCustomCategoriesView();
    if (!customView) return;

    // Insert after the categories section
    defaultCategoriesSection.parentNode.insertBefore(customView, defaultCategoriesSection.nextSibling);

    // Add toggle button to default view header
    if (settings.show_toggle_button) {
      const defaultSectionHeader = defaultCategoriesSection.querySelector(".sidebar-section-header");
      if (defaultSectionHeader) {
        const defaultToggleBtn = document.createElement("button");
        defaultToggleBtn.id = "default-view-toggle-btn";
        defaultToggleBtn.className = "sidebar-toggle-btn";
        defaultToggleBtn.innerHTML = "📂";
        defaultToggleBtn.title = "Switch to Custom View";
        defaultToggleBtn.onclick = toggleView;
        defaultSectionHeader.appendChild(defaultToggleBtn);
      }
    }

    // Apply user preference
    const preference = getUserPreference();
    const defaultToggleBtn = document.getElementById("default-view-toggle-btn");
    if (preference === "custom") {
      defaultCategoriesSection.style.display = "none";
      customView.style.display = "block";
      if (defaultToggleBtn) defaultToggleBtn.style.display = "none";
    } else {
      defaultCategoriesSection.style.display = "block";
      customView.style.display = "none";
    }

    // Add toggle button if enabled - place it in the custom view header
    if (settings.show_toggle_button) {
      const existingToggle = document.getElementById("sidebar-categories-toggle");
      if (existingToggle) {
        existingToggle.remove();
      }

      // Create a header for the custom categories section
      const customHeader = document.createElement("div");
      customHeader.className = "custom-categories-header";
      customHeader.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 0.5em 1em; margin-bottom: 0.5em;";
      
      const headerTitle = document.createElement("span");
      headerTitle.textContent = "Categories";
      headerTitle.style.cssText = "font-weight: 600; font-size: 0.9em;";
      customHeader.appendChild(headerTitle);

      const toggleButton = document.createElement("button");
      toggleButton.id = "sidebar-categories-toggle";
      toggleButton.className = "btn-flat";
      toggleButton.innerHTML = "⚙️";
      toggleButton.title = "Switch to default categories view";
      toggleButton.style.cssText = "padding: 0.25em 0.5em; background: transparent; border: none; cursor: pointer; font-size: 1em; opacity: 0.7; transition: opacity 0.2s;";
      toggleButton.onmouseover = () => toggleButton.style.opacity = "1";
      toggleButton.onmouseout = () => toggleButton.style.opacity = "0.7";
      toggleButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleView();
      });

      customHeader.appendChild(toggleButton);
      customView.insertBefore(customHeader, customView.firstChild);
    }
  }
});
