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

    // Build sections 1-4
    for (let i = 1; i <= 4; i++) {
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
        linkContent.textContent = category.name;
        
        categoryLink.appendChild(linkContent);
        contentWrapper.appendChild(categoryLink);
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
        linkContent.textContent = category.name;
        
        categoryLink.appendChild(linkContent);
        ungroupedSection.appendChild(categoryLink);
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

        // Find the target location for toggle button
        const categoriesHeader = defaultCategoriesSection.querySelector(".sidebar-section-header");
        if (categoriesHeader) {
          const toggleButton = document.createElement("button");
          toggleButton.id = "sidebar-categories-toggle";
          toggleButton.className = "sidebar-section-header-button";
          toggleButton.innerHTML = "⚙️";
          toggleButton.title = "Toggle custom/default categories view";
          toggleButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleView();
          });

          categoriesHeader.appendChild(toggleButton);
        }
      }
    });
  });
});
