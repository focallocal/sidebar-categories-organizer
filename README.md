# Sidebar Categories Organizer

A Discourse theme component that organizes sidebar categories into customizable collapsible color-coded sections with advanced features.

## Features

- **10 Collapsible Sections**: Group categories into up to 10 custom sections
- **Color Customization**: Set background and text colors for each section header
- **Gradient Backgrounds**: Optional gradient fade effect like in the photos
- **Category Badges**: Default discourse colored badges next to categories can be toggled on and off
- **Subcategories Support**: Per-section toggle to show/hide subcategories (indented display)
- **Category Hiding**: Hide specific categories from all views
- **Bidirectional Toggle**: Switch between custom sections and default Discourse view (toggle button appears in both views)
- **Persistent State**: Remembers which sections are open/closed and user's view preference
- **Permission Aware**: Only shows categories users have access to
- **Ungrouped Categories**: Automatically displays any uncategorized categories in a separate section
- **Mobile Responsive**: Works on all device sizes

## Installation

1. Go to **Admin → Customize → Themes** in your Discourse instance
2. Click **Install** → **From a Git repository**
3. Enter: `https://github.com/focallocal/sidebar-categories-organizer`
4. Click **Install**
5. Add the component to your active theme

## Configuration

### Global Settings

- **Enable Sidebar Organizer**: Turn the custom view on/off
- **Show Toggle Button**: Display 📂 icon to switch between views (appears in both custom and default view headers)
- **Show Category Badges**: Display colored squares next to category names
- **Use Gradient Fade**: Enable gradient background effect on section headers (50% solid color, 50% fade to transparent)
- **Categories to Hide**: Comma-separated category slugs to hide from all views (e.g., `staff,private`)
- **Default View**: Choose which view loads by default (custom or default)

### Section Settings (1-10)

Each section has:
- **Enabled**: Toggle section on/off
- **Title**: Section header text
- **Background Color**: Color picker for section header background
- **Text Color**: Color picker for header text
- **Categories**: Comma-separated category slugs (e.g., `general,support,feedback`)
- **Show Subcategories**: Toggle to show/hide subcategories for this section
- **Default Open**: Whether section starts expanded or collapsed

## Finding Category Slugs

Category slugs are in the URL:
- `yoursite.com/c/general/5` → slug is `general`
- `yoursite.com/c/feature-requests/12` → slug is `feature-requests`

## Usage

Once installed and configured:

1. **Custom View**: Categories are grouped into your configured sections with colored headers
2. **Expand/Collapse**: Click section headers to toggle content visibility
3. **Toggle Views**: Click the 📂 icon in the header to switch between custom and default views
   - In custom view: Toggle button appears in the custom view header
   - In default view: Toggle button appears in the default "Categories" header
4. **Subcategories**: When enabled per section, subcategories appear indented below parent categories
5. **Category Badges**: Small colored squares (if enabled) show each category's color
6. **Ungrouped Categories**: Any categories not assigned to sections appear in "Other Categories"
7. **Preferences**: Your view choice and open/closed state are saved per browser

## Advanced Features

### Gradient Backgrounds
When enabled, section headers use a smooth gradient:
- 50% solid color (your chosen background color)
- 50% fade to transparent
- Creates a modern, sleek appearance

### Category Hiding
Specify category slugs to completely hide from the sidebar:
- Useful for staff-only or deprecated categories
- Applies to both custom and default views
- Comma-separated list (e.g., `staff,private,archived`)

### Subcategories
- Toggle per section (not global)
- Indented display with slightly smaller font
- Reduced opacity for visual hierarchy
- Maintains category badge colors

## Version

- **Current**: 1.0.1
- **Minimum Discourse**: 3.3.0
- **Author**: Andy@Focallocal

## License

MIT License - See LICENSE file

## Support

Report issues: https://github.com/focallocal/sidebar-categories-organizer/issues
