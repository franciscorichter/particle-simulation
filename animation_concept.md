# Particle System Animation Concept

## Overview
This animation creates an interactive particle system with dynamic connections between particles. The particles move around the canvas with slight randomness, and when particles come close to each other, they form connections visualized as lines. The user can interact with the system by clicking and dragging to attract particles toward the mouse position.

## Visual Elements
1. **Particles**: Small circular elements that move around the canvas
   - Each particle has a unique color (using HSB color mode)
   - Particles have slightly varied sizes for visual interest
   - Particles wrap around the edges of the canvas for continuous motion

2. **Connections**: Lines drawn between particles that are within a certain distance
   - Connection opacity is based on distance (closer particles have more opaque connections)
   - Connection color matches the source particle's hue
   - Creates a network-like visual effect

3. **Motion**: Particles move with slight randomness
   - Each particle has its own velocity vector
   - When mouse is pressed, particles are attracted to the mouse position
   - Creates a fluid, organic motion

4. **Background**: Dark background with slight transparency in redraw
   - Creates a trailing effect as particles move
   - Enhances the visual appeal of the animation

## Interaction
- **Mouse Press**: When the user presses the mouse, particles are attracted to the mouse position
- **Window Resize**: Canvas automatically resizes to fill the window

## Planned Enhancements
1. Add particle color transitions over time
2. Implement particle size pulsing
3. Add repulsion mode with keyboard controls
4. Create special effects when particles collide
5. Add options for different visual modes/themes
