#!/usr/bin/env python3
"""
Game of Life Animation Runner

This script creates and runs a Conway's Game of Life animation with cluster coloring.
The animation shows different colored clusters based on their size.
"""

import sys
import os

# Add the src directory to Python path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from game_of_life import GameOfLife
from animator import GameOfLifeAnimator


def main():
    """Main function to run the Game of Life animation."""
    # Configuration
    grid_height = 50
    grid_width = 100  # 2 * height for horizontal layout
    initial_population = 1000
    num_generations = 100
    
    print("Initializing Game of Life...")
    print(f"Grid size: {grid_height} x {grid_width}")
    print(f"Initial population: {initial_population}")
    print(f"Generations: {num_generations}")
    
    # Create Game of Life instance
    game = GameOfLife(grid_height, grid_width, initial_population)
    
    # Create animator
    animator = GameOfLifeAnimator(game, figsize=(16, 8))
    
    print("Creating animation...")
    
    # Save animation as GIF
    output_file = 'game_of_life.gif'
    animator.save_animation(output_file, num_generations, interval=100)
    
    print(f"Animation saved as {output_file}")
    
    # Show the animation
    print("Displaying animation...")
    animator.show(num_generations, interval=100)
    
    print("Done!")


if __name__ == "__main__":
    main()
