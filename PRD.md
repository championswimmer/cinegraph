# CineGraph - Interactive Movie Discovery Platform

CineGraph is a visual movie discovery tool that maps relationships between movies, actors, and directors through an interactive network graph, enabling users to explore cinema through creative connections and personalized filters.

**Experience Qualities**:
1. **Exploratory** - Users should feel like they're on a journey of discovery, uncovering hidden connections between their favorite films and talents
2. **Visual** - The graph interface should be intuitive and aesthetically pleasing, making complex relationships immediately comprehensible
3. **Personalized** - Every interaction should feel tailored to the user's preferences through intelligent filtering and watchlist management

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a sophisticated application involving TMDB API integration, complex graph visualization with D3.js, modal-based workflows, persistent state management for watchlists, and intricate user interaction patterns for exploring and filtering cinematic connections.

## Essential Features

### 1. Search Entry Point
- **Functionality**: Dual-mode search allowing users to enter either a movie title or a person's name (actor/director)
- **Purpose**: Serves as the gateway to discovery, accommodating different starting points based on user preference
- **Trigger**: User types in the search input and selects from autocomplete suggestions
- **Progression**: User types query → TMDB API fetches suggestions → User selects option → System detects type (movie/person) → Appropriate graph is rendered
- **Success criteria**: Accurate type detection, fast autocomplete (<500ms), smooth transition to graph view

### 2. Movie-Centric Graph Visualization
- **Functionality**: When a movie is selected, display a graph showing the movie at center with top actors and director as connected nodes
- **Purpose**: Visualize the talent network behind a specific film
- **Trigger**: User selects a movie from search results
- **Progression**: Movie selected → Fetch credits from TMDB → Extract top 5 actors + director → Render D3 force-directed graph → Nodes become interactive
- **Success criteria**: Graph renders within 1 second, nodes are clearly labeled, connections are visually distinct

### 3. Person-Centric Graph Visualization
- **Functionality**: When an actor/director is selected, show their top 5 movies as connected nodes with option to load more
- **Purpose**: Explore a talent's filmography visually
- **Trigger**: User selects a person from search results
- **Progression**: Person selected → Fetch filmography from TMDB → Sort by popularity/rating → Display top 5 movies → "Load More" button adds 5 additional movies to graph
- **Success criteria**: Proper sorting, smooth node addition when loading more, no layout disruption

### 4. Node Expansion with Filters
- **Functionality**: Clicking actor/director nodes opens a modal with filter options (genre, granular time periods, rating vs popularity) before fetching related movies
- **Purpose**: Give users control over what types of movies they discover from each talent
- **Trigger**: User clicks on an actor or director node in the graph
- **Progression**: Node clicked → Modal opens with filter UI → User selects genre/era/sort preference (Before 1960, 1960-1980, 1980-2000, 2000-2020, 2020+) → Fetch 5 filtered movies from TMDB → Add movies to graph connected to clicked node → Node marked as "expanded"
- **Success criteria**: Filters produce relevant results, graph layout adjusts smoothly, no duplicate movies

### 5. Movie Watchlist Management
- **Functionality**: Clicking movie nodes opens a modal to mark as watched or add to watchlist
- **Purpose**: Allow users to track viewing status and build a personal queue
- **Trigger**: User clicks on a movie node in the graph
- **Progression**: Movie node clicked → Modal displays movie details + poster → User selects "Mark Watched" or "Add to Watchlist" → Status saved to KV store → Node visual updates (color/badge) → Modal closes
- **Success criteria**: Watchlist persists across sessions, visual indicators are clear, status can be toggled

### 6. Graph Interaction & Navigation
- **Functionality**: Nodes can be dragged, graph can be panned/zoomed, any node can be collapsed/expanded to hide/show all descendant branches
- **Purpose**: Provide fluid exploration of complex relationship networks and manage visual complexity
- **Trigger**: User interacts with graph canvas or uses Ctrl+Click on nodes
- **Progression**: User drags node → Force simulation updates → Node position changes | User Ctrl+Clicks node → All descendant nodes (and their branches) hide/show with smooth transition → Collapsed indicator appears on parent node
- **Success criteria**: Smooth 60fps animations, intuitive zoom/pan controls, collapse/expand works for any node type, visual indicator shows collapsed state

## Edge Case Handling

- **No Results Found**: Display friendly message with suggestion to try different search terms or popular movies/actors
- **API Rate Limiting**: Implement request debouncing and show loading states; cache results in session storage
- **Duplicate Nodes**: Check existing graph nodes before adding to prevent duplicates; if duplicate found, highlight existing node
- **Large Graphs**: Limit visible nodes to 50 with option to hide branches; implement performance optimizations for force simulation
- **Network Errors**: Show toast notifications with retry option; gracefully fall back to cached data if available
- **Missing Data**: Handle missing posters, release dates, or credits with placeholder content

## Design Direction

The design should evoke a sense of cinematic sophistication and data-driven discovery. Think film noir meets modern data visualization - dark, elegant, with pops of vibrant color representing the magic of cinema. The graph should feel like a constellation of films, where each node is a star waiting to be explored. Interactions should be smooth and satisfying, with subtle animations that feel premium and intentional.

## Color Selection

A dark, dramatic palette inspired by movie theaters and film noir, with vibrant accent colors representing different node types.

- **Primary Color**: Deep Navy Blue `oklch(0.25 0.05 250)` - Communicates depth, sophistication, and the darkness of a theater
- **Secondary Colors**: 
  - Charcoal Background `oklch(0.15 0.01 260)` - Main canvas, like a cinema screen
  - Midnight Card `oklch(0.20 0.02 255)` - Elevated surfaces for modals and panels
- **Accent Color**: Electric Cyan `oklch(0.75 0.15 210)` - CTAs and important interactions, representing the glow of a projector
- **Node Colors**:
  - Movie Nodes: Golden Yellow `oklch(0.80 0.15 85)` - Like film reels and Oscar statuettes
  - Actor Nodes: Vibrant Magenta `oklch(0.70 0.20 330)` - Energy and star power
  - Director Nodes: Emerald Green `oklch(0.70 0.15 160)` - Vision and creativity
- **Foreground/Background Pairings**:
  - Primary (Deep Navy #1F2544): White text `oklch(0.98 0 0)` - Ratio 10.5:1 ✓
  - Background (Charcoal #0D1117): Light gray text `oklch(0.85 0.01 260)` - Ratio 12.8:1 ✓
  - Accent (Electric Cyan #4DB8FF): Dark navy text `oklch(0.20 0.05 250)` - Ratio 7.2:1 ✓
  - Cards (Midnight #1C1F2E): White text `oklch(0.98 0 0)` - Ratio 11.2:1 ✓

## Font Selection

The typography should balance modern tech aesthetics with cinematic elegance, using a geometric sans-serif for UI elements and a sophisticated display font for titles.

- **Typographic Hierarchy**:
  - H1 (App Title/Movie Titles): Space Grotesk Bold / 32px / -0.02em letter spacing
  - H2 (Section Headers): Space Grotesk SemiBold / 24px / -0.01em letter spacing
  - H3 (Node Labels): Space Grotesk Medium / 16px / normal letter spacing
  - Body (Descriptions): Inter Regular / 14px / 0.01em letter spacing
  - Small (Metadata): Inter Regular / 12px / 0.02em letter spacing / uppercase for labels

## Animations

Animations should feel cinematic and purposeful - smooth transitions that guide the eye without distracting. The graph should have gentle physics-based movement that settles naturally. Node appearances should fade and scale in like stars appearing in the night sky. Modal transitions should slide in with a slight backdrop blur effect reminiscent of depth of field in cinematography.

- Graph nodes: Fade + scale in over 400ms with elastic easing
- Modal open/close: Slide up 300ms + backdrop blur transition
- Node expansion: Stagger children animation (50ms delay between each)
- Hover states: Subtle scale (1.05) over 150ms
- Status changes: Color transition over 200ms with pulse effect

## Component Selection

- **Components**:
  - **Dialog**: For movie details and filter modals - customized with dark theme and backdrop blur
  - **Input**: Search bar with autocomplete - styled with focus glow effect
  - **Button**: Primary actions (search, load more, add to watchlist) - customized with gradient hover effects
  - **Badge**: Status indicators (watched, watchlist, expanded) - color-coded by type
  - **Card**: Movie detail cards within modals - dark with subtle border glow
  - **Checkbox**: Filter selections in expansion modal - custom accent color
  - **RadioGroup**: Sort options (popular vs rated) - horizontal layout
  - **Select**: Genre and era dropdowns - custom styling to match theme
  - **ScrollArea**: For long lists in modals - custom scrollbar styling
  - **Separator**: Visual dividers in modals - subtle gradient
  
- **Customizations**:
  - Custom graph canvas component using D3.js for force-directed layout
  - Custom node renderer with SVG circles, gradients, and labels
  - Custom autocomplete dropdown (not in shadcn) with keyboard navigation
  
- **States**:
  - Buttons: Default (gradient bg), Hover (intensified gradient + scale), Active (pressed inset), Disabled (opacity 50%)
  - Graph Nodes: Default (colored circle), Hover (glow effect + scale), Active (pulsing ring), Expanded (checkmark badge)
  - Movie Nodes: Unwatched (default gold), Watched (desaturated gold + check icon), Watchlist (gold + bookmark icon)
  
- **Icon Selection**:
  - Search: MagnifyingGlass
  - Movie: FilmStrip
  - Actor: User
  - Director: VideoCamera
  - Watchlist: BookmarkSimple
  - Watched: CheckCircle
  - Expand: Plus
  - Collapsed: Minus (horizontal line)
  - Close: X
  - Load More: ArrowDown
  - Filter: Funnel
  
- **Spacing**:
  - Container padding: p-6 (24px)
  - Card padding: p-4 (16px)
  - Button padding: px-6 py-3
  - Graph margins: m-0 (full bleed)
  - Modal spacing: gap-4 between sections
  - Node spacing: Controlled by D3 force simulation (link distance: 150px)
  
- **Mobile**:
  - Search bar: Full width with reduced font size (14px)
  - Graph: Touch-enabled pan/zoom, larger touch targets for nodes (44px min)
  - Modals: Full screen on mobile with slide-up animation
  - Filter controls: Stack vertically instead of horizontal grid
  - Node labels: Show on tap instead of hover
  - "Load More" button: Sticky at bottom on mobile
