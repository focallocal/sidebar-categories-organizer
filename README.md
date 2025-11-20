# Sidebar Categories Organizer

A Discourse theme component that organizes sidebar categories into customizable collapsible sections with color-coded headers.

## Features

- **Collapsible Category Sections**: Group categories into 4 custom sections
- **Color Customization**: Set background and text colors for each section
- **Toggle View**: Switch between custom sections and default Discourse categories list
- **Persistent State**: Remembers which sections are open/closed per user
- **Permission Aware**: Only shows categories users have access to
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
- **Show Toggle Button**: Display gear icon to switch between views
- **Default View**: Choose which view loads by default (custom or default)

### Section Settings (1-4)

Each section has:
- **Enabled**: Toggle section on/off
- **Title**: Section header text
- **Background Color**: Color picker for section header
- **Text Color**: Color picker for header text
- **Categories**: Comma-separated category slugs (e.g., `general,support,feedback`)
- **Default Open**: Whether section starts expanded

## Finding Category Slugs

Category slugs are in the URL:
- `yoursite.com/c/general/5` → slug is `general`
- `yoursite.com/c/feature-requests/12` → slug is `feature-requests`

## Usage

Once installed and configured:
1. Categories will be grouped into your custom sections
2. Click section headers to expand/collapse
3. Click the gear icon (⚙️) next to "Categories" to toggle between custom and default views
4. Your preferences are saved per-browser

## Version

- **Current**: 1.0.0
- **Minimum Discourse**: 3.6.0

## License

MIT License - See LICENSE file

## Support

Report issues: https://github.com/focallocal/sidebar-categories-organizer/issues
