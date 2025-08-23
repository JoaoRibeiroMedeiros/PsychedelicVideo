#!/usr/bin/env python3
"""
Simple Psychedelic Animation Script

Quick script to create a rotating polygons animation.
"""

import sys
import os
import numpy as np
import math

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from animator import PsychedelicAnimator

def rotating_polygons_frame(frame):
    """Generate a rotating polygons frame."""
    width, height = 800, 600
    center_x, center_y = width // 2, height // 2
    
    # Create black canvas
    canvas = np.zeros((height, width, 3))
    
    # Animation parameters
    t = frame * 0.1
    num_polygons = 6
    sides = 6
    max_radius = 200
    min_radius = 50
    
    for i in range(num_polygons):
        radius = min_radius + (max_radius - min_radius) * (i / (num_polygons - 1))
        rotation = t + (i * math.pi / num_polygons)
        
        # Generate polygon vertices
        angles = np.linspace(0, 2*math.pi, sides + 1) + rotation
        x_coords = center_x + radius * np.cos(angles)
        y_coords = center_y + radius * np.sin(angles)
        
        # Calculate color (rainbow effect)
        hue = (t * 0.01 + i * 0.2) % 1.0
        color = hsv_to_rgb(hue, 0.8, 0.9)
        
        # Draw polygon lines
        for j in range(sides):
            x1, y1 = int(x_coords[j]), int(y_coords[j])
            x2, y2 = int(x_coords[j + 1]), int(y_coords[j + 1])
            draw_line(canvas, x1, y1, x2, y2, color, width, height)
    
    return canvas

def hsv_to_rgb(h, s, v):
    """Convert HSV to RGB."""
    c = v * s
    x = c * (1 - abs((h * 6) % 2 - 1))
    m = v - c
    
    if h < 1/6:
        r, g, b = c, x, 0
    elif h < 2/6:
        r, g, b = x, c, 0
    elif h < 3/6:
        r, g, b = 0, c, x
    elif h < 4/6:
        r, g, b = 0, x, c
    elif h < 5/6:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    
    return (r + m, g + m, b + m)

def draw_line(canvas, x1, y1, x2, y2, color, width, height):
    """Draw a line on the canvas using Bresenham's algorithm."""
    dx = abs(x2 - x1)
    dy = abs(y2 - y1)
    sx = 1 if x1 < x2 else -1
    sy = 1 if y1 < y2 else -1
    err = dx - dy
    
    while True:
        if 0 <= x1 < width and 0 <= y1 < height:
            canvas[y1, x1] = color
        
        if x1 == x2 and y1 == y2:
            break
            
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x1 += sx
        if e2 < dx:
            err += dx
            y1 += sy

def main():
    """Create a quick psychedelic animation."""
    print("Creating rotating polygons animation...")
    
    animator = PsychedelicAnimator(width=800, height=600)
    
    # Save and show
    animator.save_gif(rotating_polygons_frame, 'psychedelic_animation.gif', num_frames=100, fps=20)
    animator.show(rotating_polygons_frame, num_frames=100)
    
    print("Done!")

if __name__ == "__main__":
    main()
