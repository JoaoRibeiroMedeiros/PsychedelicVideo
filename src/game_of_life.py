import numpy as np
import random
from scipy.ndimage import label


class GameOfLife:
    """Conway's Game of Life implementation with cluster coloring."""
    
    def __init__(self, height, width, initial_population):
        """
        Initialize the Game of Life grid.
        
        Args:
            height: Grid height
            width: Grid width  
            initial_population: Number of initial live cells
        """
        self.height = height
        self.width = width
        self.grid = self._create_grid(initial_population)
    
    def _create_grid(self, initial_population):
        """Create initial grid with random live cells."""
        grid = np.zeros((self.height, self.width), dtype=int)
        for _ in range(initial_population):
            x = random.randint(0, self.height - 1)
            y = random.randint(0, self.width - 1)
            grid[x, y] = 1
        return grid
    
    def update(self):
        """Update grid to next generation according to Conway's rules."""
        new_grid = np.copy(self.grid)
        
        for i in range(self.height):
            for j in range(self.width):
                live_neighbors = self._count_neighbors(i, j)
                
                if self.grid[i, j] == 1:  # Live cell
                    if live_neighbors < 2 or live_neighbors > 3:
                        new_grid[i, j] = 0  # Dies
                else:  # Dead cell
                    if live_neighbors == 3:
                        new_grid[i, j] = 1  # Born
        
        self.grid = new_grid
    
    def _count_neighbors(self, i, j):
        """Count live neighbors around cell (i, j)."""
        live_neighbors = 0
        for x in range(-1, 2):
            for y in range(-1, 2):
                if (x != 0 or y != 0) and \
                   (i + x >= 0 and i + x < self.height) and \
                   (j + y >= 0 and j + y < self.width):
                    live_neighbors += self.grid[i + x, j + y]
        return live_neighbors
    
    def get_cluster_colors(self):
        """
        Generate colors for clusters based on their size.
        
        Returns:
            RGB color array with shape (height, width, 3)
        """
        # Label connected components
        labeled_array, num_features = label(self.grid)
        
        # Create a color map for the clusters with white background
        colors = np.ones((self.height, self.width, 3))  # RGB colors, initialized to white
        
        # Calculate cluster sizes
        cluster_sizes = np.bincount(labeled_array.ravel())[1:]  # Skip background (0)
        
        # Assign colors based on cluster size
        for i in range(1, num_features + 1):
            mask = labeled_array == i
            size = cluster_sizes[i-1]
            
            # Use size to generate deterministic color
            # Normalize size to [0,1] range using a reasonable max size
            normalized_size = min(size / 100, 1.0)  # Cap at 100 cells for color scaling
            
            # Create a color based on size (using HSV color space for better visualization)
            # Blue (0.6) to Yellow (0.15) in HSV
            hue = 0.6 - (normalized_size * 0.45)  # Transition from blue to yellow
            saturation = 0.9  # Keep high saturation for vibrant colors
            value = 0.9  # Keep high value for bright colors
            
            # Convert HSV to RGB
            color = self._hsv_to_rgb(hue, saturation, value)
            colors[mask] = color
        
        return colors
    
    def _hsv_to_rgb(self, h, s, v):
        """Convert HSV color to RGB."""
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
            
        return np.array([r + m, g + m, b + m])
